import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, gt, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '../db'
import { ffhbMatch, ffhbTeam, licencee } from '../db/schema'

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
  const webp = filename.replace(/\.(jpg|JPG|png|PNG|jpeg|JPEG)$/, '.webp')
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
  const rows = await db
    .select()
    .from(ffhbMatch)
    .where(isNotNull(ffhbMatch.score1))
    .orderBy(desc(ffhbMatch.date))
    .limit(8)
  return rows
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
  // Récupère les résultats du week-end précédent pour générer l'actu
  const lastMonday = sql`(NOW() - (EXTRACT(DOW FROM NOW())::int + 6) * interval '1 day')::date`
  const rows = await db
    .select()
    .from(ffhbMatch)
    .where(
      and(
        isNotNull(ffhbMatch.score1),
        sql`${ffhbMatch.date} >= ${lastMonday}`,
        sql`${ffhbMatch.date} < NOW()`,
      ),
    )
    .orderBy(asc(ffhbMatch.date))
  return rows
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
