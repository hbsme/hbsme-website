import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, gt, isNotNull, isNull } from 'drizzle-orm'
import { db } from '../db'
import { ffhbMatch, ffhbTeam } from '../db/schema'

const CLUB = 'HANDBALL SAINT MEDARD D\'EYRANS'
const LOGO_BASE = 'https://media.ffhandball.fr/logos/'
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
  return `${LOGO_BASE}${filename}`
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
