import Anthropic from '@anthropic-ai/sdk'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ─── types ───────────────────────────────────────────────────────────────────

type Match = {
  date: Date | string | null
  team1: string | null
  team2: string | null
  score1: string | number | null
  score2: string | number | null
  competition: string | null
}

type CacheEntry = {
  week: string
  text: string
  generatedAt: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

const CACHE_FILE = join(tmpdir(), 'hbsme_weekend_summary.json')
const CLUB = "HANDBALL SAINT MEDARD D'EYRANS"

function readCache(): CacheEntry | null {
  try {
    if (!existsSync(CACHE_FILE)) return null
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as CacheEntry
  } catch {
    return null
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(entry), 'utf-8')
  } catch {
    // cache write failure is non-critical
  }
}

function isHome(team1: string | null): boolean {
  return team1 === CLUB
}

function matchResult(score1: string | number | null, score2: string | number | null, team1: string | null): 'win' | 'loss' | 'draw' | null {
  if (score1 == null || score2 == null) return null
  const home = isHome(team1)
  const clubScore = Number(home ? score1 : score2)
  const oppScore = Number(home ? score2 : score1)
  if (clubScore > oppScore) return 'win'
  if (clubScore < oppScore) return 'loss'
  return 'draw'
}

function buildPrompt(matches: Match[]): string {
  if (matches.length === 0) {
    return ''
  }

  const lines = matches.map((m) => {
    const home = isHome(m.team1)
    const clubScore = Number(home ? m.score1 : m.score2)
    const oppScore = Number(home ? m.score2 : m.score1)
    const opponent = home ? m.team2 : m.team1
    const domExt = home ? 'domicile' : 'extérieur'
    const competition = m.competition ?? 'Championnat'
    const result = matchResult(m.score1, m.score2, m.team1)
    const resultFr = result === 'win' ? 'victoire' : result === 'loss' ? 'défaite' : 'match nul'
    return `- ${competition} (${domExt}) : HBSME ${clubScore} – ${oppScore} ${opponent ?? 'Adversaire'} → ${resultFr}`
  })

  return `Tu es le rédacteur du site web du Handball Saint-Médard d'Eyrans (HBSME), un club de handball en Gironde.

Voici les résultats du week-end de nos équipes :
${lines.join('\n')}

Écris un court résumé d'actu (3-4 phrases maximum), ton dynamique et bienveillant, en français. Style : communiqué de club, chaleureux, encourageant. Pas de liste, pas de markdown — texte narratif simple. Termine par "Allez Saint-Médard ! 🤾"`
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generateWeekendSummary(matches: Match[]): Promise<string> {
  if (matches.length === 0) {
    return "Pas de matchs disputés ce week-end. Rendez-vous la semaine prochaine pour suivre nos équipes ! 🤾"
  }

  const currentWeek = getISOWeek(new Date())

  // Check cache
  const cached = readCache()
  if (cached?.week === currentWeek) {
    return cached.text
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback si pas de clé configurée
    const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
    const total = matches.length
    return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} étai${total > 1 ? 'ent' : 't'} au programme pour nos équipes. ${wins > 0 ? `Avec ${wins} victoire${wins > 1 ? 's' : ''} au compteur, le bilan est encourageant.` : 'Malgré des résultats difficiles, nos joueurs ont montré de la combativité.'} Retrouvez le détail des scores dans la section Résultats ci-dessous. Allez Saint-Médard ! 🤾`
  }

  try {
    const client = new Anthropic({ apiKey })
    const prompt = buildPrompt(matches)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    if (text) {
      writeCache({ week: currentWeek, text, generatedAt: new Date().toISOString() })
      return text
    }
  } catch (err) {
    console.error('[HBSME] AI summary error:', err)
  }

  // Fallback en cas d'erreur
  const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
  const total = matches.length
  return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} était${total > 1 ? 'ent' : ''} au programme. ${wins > 0 ? `${wins} victoire${wins > 1 ? 's' : ''} à célébrer !` : 'Nos équipes ont montré de la combativité.'} Rendez-vous la semaine prochaine. Allez Saint-Médard ! 🤾`
}
