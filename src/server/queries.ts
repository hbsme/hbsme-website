import { createServerFn } from '@tanstack/react-start'
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

export const getUpcomingMatches = createServerFn().handler(async () => {
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
})

export const getRecentResults = createServerFn().handler(async () => {
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
})

export const getStandings = createServerFn().handler(async () => {
  const rows = await db
    .select()
    .from(ffhbTeam)
    .where(isNotNull(ffhbTeam.score_place))
    .orderBy(asc(ffhbTeam.competition), asc(ffhbTeam.score_place))
  return rows
})

export const getUpcomingBirthdays = createServerFn().handler(async () => {
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
})

export const getWeekendNews = createServerFn().handler(async () => {
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
})

export const getTeamOverview = createServerFn().handler(async () => {
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
})

export const getMatchHistory = createServerFn().handler(async () => {
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
})

export const getPartenaires = createServerFn().handler(async () => {
  return db
    .select()
    .from(partenaire)
    .where(eq(partenaire.active, true))
    .orderBy(asc(partenaire.sortOrder), asc(partenaire.name))
})

export const getMembresCa = createServerFn().handler(async () => {
  return db
    .select()
    .from(membreCa)
    .where(eq(membreCa.active, true))
    .orderBy(asc(membreCa.sortOrder), asc(membreCa.nom))
})

// ─── Collectifs ───────────────────────────────────────────────────────────────

export const getCollectifs = createServerFn().handler(async () => {
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
    if (row.coachNom) {
      map.get(row.id)!.coachs.push({
        prenom: row.coachPrenom!, nom: row.coachNom,
        photo: row.coachPhoto, role: row.coachRole,
      })
    }
  }

  return { collectifs: Array.from(map.values()), saison, isCurrent: saison === currentSaison }
})

// ─── Galerie photos ───────────────────────────────────────────────────────────

export const getGalleryPhotos = createServerFn().handler(async () => {
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
})
