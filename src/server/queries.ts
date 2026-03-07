import { createServerFn } from '@tanstack/react-start'
import { withCache, TTL } from '../lib/cache'
import { and, asc, desc, eq, gt, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '../db'
import { ffhbMatch, ffhbTeam, licencee, membreCa, partenaire, collectif as collectifTable, collectifCoach, hbsmeUser } from '../db/schema'

const CLUB = 'HANDBALL SAINT MEDARD D\'EYRANS'
const LOGO_BASE = 'https://media-logos-clubs.ffhandball.fr/64/'
const EPOCH_FILTER = new Date('2000-01-01')

export function formatCompetition(raw: string): string {
  return raw
    .replace(/^GIRONDE_/, '')
    .replace(/\+16 MASCULINS/, 'Séniors Masculins')
    .replace(/\+16 FEMININE/, 'Séniors Féminines')
    .replace(/\+16 FEMININ/, 'Séniors Féminines')
    .replace(/U(\d+) MASCULINE?S?/, 'U$1 Masculins')
    .replace(/U(\d+) FEMININE?S?/, 'U$1 Féminines')
    .replace(/U(\d+) FEMININ/, 'U$1 Féminines')
    .replace(/EXCELLENCE/, 'Excellence')
    .replace(/PROMOTION/, 'Promotion')
    .replace(/HONNEUR/, 'Honneur')
    .replace(/BRASSAGE.*/, '')
    .trim()
}

export function logoUrl(filename: string | null): string | null {
  if (!filename) return null
  // Le CDN FFHB ne sert que les .webp (403 sur jpg/png)
  const webp = filename.replace(/\.(jpg|JPG|png|PNG|jpeg|JPEG|gif|GIF)$/, '.webp')
  return `${LOGO_BASE}${webp}`
}

export function isHome(team1: string): boolean {
  return team1.startsWith(CLUB.substring(0, 15))
}

export const getUpcomingMatches = createServerFn().handler(() =>
  withCache('upcoming-matches', async () => {
  const now = new Date()
  const rows = await db
    .select()
    .from(ffhbMatch)
    .where(
      and(
        isNull(ffhbMatch.score1),
        isNotNull(ffhbMatch.date),
        gt(ffhbMatch.date, EPOCH_FILTER),
        gt(ffhbMatch.date, now),
      ),
    )
    .orderBy(asc(ffhbMatch.date))
    .limit(8)
  return rows
}, TTL.LIVE)
)

export const getRecentResults = createServerFn().handler(() =>
  withCache('recent-results', async () => {
  // Retourne tous les résultats depuis lundi dernier (même fenêtre que l'actu)
  // Si rien cette semaine, repli sur les 12 derniers pour ne pas afficher une section vide
  const lastMonday = sql`(NOW() - (EXTRACT(DOW FROM NOW())::int + 6) * interval '1 day')::date`
  const thisWeek = await db
    .select()
    .from(ffhbMatch)
    .where(
      and(
        isNotNull(ffhbMatch.score1),
        sql`${ffhbMatch.date} >= ${lastMonday}`,
        sql`${ffhbMatch.date} < NOW()`,
      ),
    )
    .orderBy(desc(ffhbMatch.date))
  if (thisWeek.length > 0) return thisWeek
  // Semaine sans matchs → on affiche les derniers résultats connus
  return db
    .select()
    .from(ffhbMatch)
    .where(isNotNull(ffhbMatch.score1))
    .orderBy(desc(ffhbMatch.date))
    .limit(12)
}, TTL.LIVE)
)

export const getStandings = createServerFn().handler(() =>
  withCache('standings', async () => {
  const rows = await db
    .select()
    .from(ffhbTeam)
    .where(isNotNull(ffhbTeam.score_place))
    .orderBy(asc(ffhbTeam.competition), asc(ffhbTeam.score_place))
  return rows
}, TTL.LIVE)
)

export const getUpcomingBirthdays = createServerFn().handler(() =>
  withCache('birthdays', async () => {
  // Anniversaires dans les 14 prochains jours (compare mois+jour, peu importe l'année)
  const rows = await db
    .select({
      firstname: licencee.firstname,
      lastname: licencee.lastname,
      birthdate: licencee.birthdate,
    })
    .from(licencee)
    .where(
      sql`
        MAKE_DATE(
          EXTRACT(YEAR FROM NOW())::int,
          EXTRACT(MONTH FROM ${licencee.birthdate})::int,
          EXTRACT(DAY FROM ${licencee.birthdate})::int
        ) BETWEEN (NOW() - interval '2 days')::date AND (NOW() + interval '5 days')::date
      `,
    )
    .orderBy(
      sql`MAKE_DATE(
        EXTRACT(YEAR FROM NOW())::int,
        EXTRACT(MONTH FROM ${licencee.birthdate})::int,
        EXTRACT(DAY FROM ${licencee.birthdate})::int
      )`,
    )
  return rows
}, TTL.LIVE)
)

export const getWeekendNews = createServerFn().handler(() =>
  withCache('weekend-news', async () => {
  const lastMonday = sql`(NOW() - (EXTRACT(DOW FROM NOW())::int + 6) * interval '1 day')::date`

  // Matchs du week-end
  const weekendMatches = await db
    .select()
    .from(ffhbMatch)
    .where(and(
      isNotNull(ffhbMatch.score1),
      sql`${ffhbMatch.date} >= ${lastMonday}`,
      sql`${ffhbMatch.date} < NOW()`,
    ))
    .orderBy(asc(ffhbMatch.date))

  // Historique 8 semaines pour contexte IA
  const allHistory = await db
    .select({ matchId: ffhbMatch.matchId, date: ffhbMatch.date, competition: ffhbMatch.competition,
      team1: ffhbMatch.team1, team2: ffhbMatch.team2, score1: ffhbMatch.score1, score2: ffhbMatch.score2 })
    .from(ffhbMatch)
    .where(and(
      isNotNull(ffhbMatch.score1),
      sql`${ffhbMatch.date} >= (NOW() - interval '8 weeks')::date`,
      sql`${ffhbMatch.date} < NOW()`,
    ))
    .orderBy(asc(ffhbMatch.date))

  const weekendIds = new Set(weekendMatches.map(m => m.matchId))
  const history = allHistory.filter(m => !weekendIds.has(m.matchId))

  const { generateWeekendSummary } = await import('../lib/ai')
  const weekendSummary = await generateWeekendSummary(weekendMatches, history)

  return { weekendMatches, weekendSummary }
}, TTL.LIVE)
)

export const getTeamOverview = createServerFn().handler(() =>
  withCache('team-overview', async () => {
  // Toutes les entrées HBSME avec matchs joués
  const rows = await db
    .select()
    .from(ffhbTeam)
    .where(
      and(
        sql`${ffhbTeam.team} ILIKE '%SAINT MEDARD%'`,
        isNotNull(ffhbTeam.score_place),
        sql`COALESCE(${ffhbTeam.score_joue}, 0) > 0`,
      ),
    )
    .orderBy(asc(ffhbTeam.competition), desc(ffhbTeam.firstday))

  // Ne garder que les entrées avec le firstday le plus récent par compétition
  const maxFirstday = new Map<string, string>()
  for (const row of rows) {
    const fd = row.firstday ?? ''
    const cur = maxFirstday.get(row.competition)
    if (!cur || fd > cur) maxFirstday.set(row.competition, fd)
  }
  return rows.filter(row => row.firstday === maxFirstday.get(row.competition))
}, TTL.LIVE)
)

export const getMatchHistory = createServerFn().handler(() =>
  withCache('match-history', async () => {
  // Récupère les 8 dernières semaines de résultats (pour contexte IA)
  const rows = await db
    .select({
      matchId: ffhbMatch.matchId,
      date: ffhbMatch.date,
      competition: ffhbMatch.competition,
      team1: ffhbMatch.team1,
      team2: ffhbMatch.team2,
      score1: ffhbMatch.score1,
      score2: ffhbMatch.score2,
    })
    .from(ffhbMatch)
    .where(
      and(
        isNotNull(ffhbMatch.score1),
        sql`${ffhbMatch.date} >= (NOW() - interval '8 weeks')::date`,
        sql`${ffhbMatch.date} < NOW()`,
      ),
    )
    .orderBy(asc(ffhbMatch.date))
  return rows
}, TTL.LIVE)
)

export const getPartenaires = createServerFn().handler(() =>
  withCache('partenaires', async () => {
  return db
    .select()
    .from(partenaire)
    .where(eq(partenaire.active, true))
    .orderBy(asc(partenaire.sortOrder), asc(partenaire.name))
}, TTL.SEASON)
)

export const getMembresCa = createServerFn().handler(() =>
  withCache('membres-ca', async () => {
  return db
    .select()
    .from(membreCa)
    .where(eq(membreCa.active, true))
    .orderBy(asc(membreCa.sortOrder), asc(membreCa.nom))
}, TTL.SEASON)
)

// ─── Collectifs ───────────────────────────────────────────────────────────────

export const getCollectifs = createServerFn().handler(() =>
  withCache('collectifs', async () => {
  // Saison courante ou dernière disponible
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const currentSaison = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`

  // Cherche la saison courante, sinon la plus récente
  const saisonRows = await db
    .selectDistinct({ saison: collectifTable.saison })
    .from(collectifTable)
    .orderBy(desc(collectifTable.saison))
    .limit(5)

  const availableSaisons = saisonRows.map(r => r.saison)
  const saison = availableSaisons.includes(currentSaison)
    ? currentSaison
    : (availableSaisons[0] ?? currentSaison)

  const rows = await db
    .select({
      id: collectifTable.id,
      categorie: collectifTable.categorie,
      nom: collectifTable.nom,
      saison: collectifTable.saison,
      description: collectifTable.description,
      photo: collectifTable.photo,
      sortOrder: collectifTable.sortOrder,
      coachPrenom: hbsmeUser.prenom,
      coachNom: hbsmeUser.nom,
      coachPhoto: hbsmeUser.photo,
      coachRole: collectifCoach.role,
      coachSortOrder: collectifCoach.sortOrder,
    })
    .from(collectifTable)
    .leftJoin(collectifCoach, eq(collectifCoach.collectifId, collectifTable.id))
    .leftJoin(hbsmeUser, eq(hbsmeUser.id, collectifCoach.userId))
    .where(and(eq(collectifTable.saison, saison), eq(collectifTable.active, true)))
    .orderBy(collectifTable.sortOrder, collectifCoach.sortOrder)

  // Regrouper les coachs par collectif
  const map = new Map<number, {
    id: number; categorie: string; nom: string; saison: string
    description: string | null; photo: string | null
    coachs: { prenom: string; nom: string; photo: string | null; role: string | null }[]
  }>()

  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id, categorie: row.categorie, nom: row.nom,
        saison: row.saison, description: row.description, photo: row.photo,
        coachs: [],
      })
    }
    if (row.coachPrenom) {
      map.get(row.id)!.coachs.push({
        prenom: row.coachPrenom!, nom: row.coachNom,
        photo: row.coachPhoto, role: row.coachRole,
      })
    }
  }

  return { collectifs: Array.from(map.values()), saison, isCurrent: saison === currentSaison }
}, TTL.SEASON)
)

// ─── Galerie photos ───────────────────────────────────────────────────────────

export const getGalleryPhotos = createServerFn().handler(() =>
  withCache('gallery-photos', async () => {
  const { readdir } = await import('fs/promises')
  const { join } = await import('path')

  const thumbDir = join(process.cwd(), 'public', 'gallery', 'thumb')
  const files = await readdir(thumbDir)

  // Trier : d'abord les plus récents (noms de fichiers avec dates)
  const sorted = files
    .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))
    .sort((a, b) => b.localeCompare(a))

  return sorted.map(filename => ({
    thumb: `/gallery/thumb/${filename}`,
    full: `/gallery/fullsize/${filename}`,
    filename,
  }))
}, TTL.STATIC)
)

// ─── Studio helpers ───────────────────────────────────────────────────────────

function studioNormalizeTeam(name: string): string {
  name = name.replace("HANDBALL SAINT MEDARD D'EYRANS", 'HBSME')
  if (name.startsWith('HBSME')) return name
  return name.split(' ').map(w => {
    if (w.length > 3) return w[0].toUpperCase() + w.slice(1).toLowerCase()
    if (w === 'LE') return 'le'
    if (w === 'LA') return 'la'
    if (w === 'DE') return 'de'
    if (w === 'ST') return 'St'
    return w
  }).join(' ')
}

function studioNormalizeComp(name: string): string {
  name = name.replace('GIRONDE_U18 FEMININES', '18F').replace('GIRONDE_U18 FEMININE', '18F')
  name = name.replace('GIRONDE_U15 FEMININES', '15F').replace('GIRONDE_U15 FEMININE', '15F')
  name = name.replace('GIRONDE_U13 FEMININES', '13F').replace('GIRONDE_U13 FEMININE', '13F')
  name = name.replace('GIRONDE_U11 FEMININES', '11F').replace('GIRONDE_U11 FEMININE', '11F')
  name = name.replaceAll('GIRONDE_U18 MASCULINS', '18G').replaceAll('GIRONDE_U18 MASCULIN', '18G')
  name = name.replaceAll('GIRONDE_U15 MASCULINS', '15G').replaceAll('GIRONDE_U15 MASCULIN', '15G')
  name = name.replaceAll('GIRONDE_U13 MASCULINS', '13G').replaceAll('GIRONDE_U13 MASCULIN', '13G')
  name = name.replace('GIRONDE_U11 MASCULINS', '11G').replace('GIRONDE_U11 MASCULIN', '11G')
  name = name.replaceAll(/.*GIRONDE_\+16 MASCULIN.*/ig, 'SG')
  name = name.replaceAll(/.*GIRONDE_\+16 FEMININ.*/ig, 'SF')
  return name.split(' ').map(w => w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ')
}

// ─── Studio types ─────────────────────────────────────────────────────────────

export interface StudioMatch {
  id: number; matchId: number; competitionId: number | null; teamId: number | null
  date: string; competition: string; team1: string; team2: string
  score1: string | null; score2: string | null; logo1: string | null; logo2: string | null
}

export interface StudioNextWeek {
  status: string; date: string
  next_sat: { date: string; home: StudioMatch[]; ext: StudioMatch[] }
  next_sun: { date: string; home_matchs: StudioMatch[]; ext_matchs: StudioMatch[] }
}

export interface StudioLastWeek {
  status: string; date: string
  sat: { date: string; matches: StudioMatch[] }
  sun: { date: string; matches: StudioMatch[] }
}

function toStudioMatch(row: typeof ffhbMatch.$inferSelect): StudioMatch {
  return {
    id: row.id, matchId: row.matchId, competitionId: row.competitionId, teamId: row.teamId,
    date: row.date ? row.date.toISOString() : '',
    competition: studioNormalizeComp(row.competition),
    team1: studioNormalizeTeam(row.team1),
    team2: studioNormalizeTeam(row.team2),
    score1: row.score1, score2: row.score2, logo1: row.logo1, logo2: row.logo2,
  }
}

async function loadMatchesOfDay(day: Date): Promise<StudioMatch[]> {
  const start = new Date(day); start.setHours(0, 0, 0, 0)
  const end = new Date(day); end.setHours(23, 59, 59, 999)
  const rows = await db.select().from(ffhbMatch)
    .where(and(
      isNotNull(ffhbMatch.date),
      sql`${ffhbMatch.date} >= ${start}`,
      sql`${ffhbMatch.date} <= ${end}`,
    ))
    .orderBy(asc(ffhbMatch.date))
  return rows.map(toStudioMatch)
}

export const getNextWeekMatches = createServerFn()
  .inputValidator((d: unknown) => d as string)
  .handler(async (ctx): Promise<StudioNextWeek> => {
    const today = ctx.data
    const d = new Date(today)
    const dow = d.getDay()
    let offset = 0
    switch (dow) {
      case 0: offset = -1; break
      case 1: offset = 5; break
      case 2: offset = 4; break
      case 3: offset = 3; break
      case 4: offset = 2; break
      case 5: offset = 1; break
      case 6: offset = 0; break
    }
    const sat = new Date(d); sat.setDate(d.getDate() + offset)
    const sun = new Date(d); sun.setDate(d.getDate() + offset + 1)
    const satStr = sat.toISOString().split('T')[0]
    const sunStr = sun.toISOString().split('T')[0]
    const [satMatches, sunMatches] = await Promise.all([
      loadMatchesOfDay(sat),
      loadMatchesOfDay(sun),
    ])
    return {
      status: 'OK', date: today,
      next_sat: {
        date: satStr,
        home: satMatches.filter(m => m.team1.includes('HBSME')),
        ext: satMatches.filter(m => !m.team1.includes('HBSME')),
      },
      next_sun: {
        date: sunStr,
        home_matchs: sunMatches.filter(m => m.team1.includes('HBSME')),
        ext_matchs: sunMatches.filter(m => !m.team1.includes('HBSME')),
      },
    }
  })

export const getLastWeekResults = createServerFn()
  .inputValidator((d: unknown) => d as string)
  .handler(async (ctx): Promise<StudioLastWeek> => {
    const today = ctx.data
    const d = new Date(today)
    const dow = d.getDay()
    let satOffset = 0
    switch (dow) {
      case 0: satOffset = -1; break
      case 1: satOffset = -6; break
      case 2: satOffset = -7; break
      case 3: satOffset = -8; break
      case 4: satOffset = -9; break
      case 5: satOffset = -10; break
      case 6: satOffset = 0; break
    }
    const sat = new Date(d); sat.setDate(d.getDate() + satOffset)
    const sun = new Date(d); sun.setDate(d.getDate() + satOffset + 1)
    const satStr = sat.toISOString().split('T')[0]
    const sunStr = sun.toISOString().split('T')[0]
    const [satMatches, sunMatches] = await Promise.all([
      loadMatchesOfDay(sat),
      loadMatchesOfDay(sun),
    ])
    return {
      status: 'ok', date: today,
      sat: { date: satStr, matches: satMatches },
      sun: { date: sunStr, matches: sunMatches },
    }
  })

export const getPhotosRs = createServerFn().handler(async (): Promise<string[]> => {
  const { readdir } = await import('fs/promises')
  try {
    const files = await readdir('/home/hbsme/scores_photos')
    return files.filter(f => f.endsWith('.jpg') || f.endsWith('.png')).sort()
  } catch { return [] }
})
