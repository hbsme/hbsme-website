import { GoogleGenerativeAI } from '@google/generative-ai'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ─── types ───────────────────────────────────────────────────────────────────

type Match = {
  matchId?: number | null
  date: Date | string | null
  team1: string | null
  team2: string | null
  score1: string | number | null
  score2: string | number | null
  competition: string | null
}

type CacheEntry = {
  hash: string
  text: string
  generatedAt: string
}

// ─── cache ───────────────────────────────────────────────────────────────────

const CACHE_FILE = join(tmpdir(), 'hbsme_weekend_summary.json')

/**
 * Hash stable de l'ensemble des matchs passés en paramètre.
 * Clé = sha256(sorted matchIds + scores) → invalide si les données changent.
 */
function computeHash(currentWeek: Match[], history: Match[]): string {
  const all = [...currentWeek, ...history]
  const stable = all
    .map(m => `${m.matchId ?? ''}:${m.score1 ?? ''}:${m.score2 ?? ''}`)
    .sort()
    .join('|')
  return createHash('sha256').update(stable).digest('hex').slice(0, 16)
}

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
    // non-critique
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const CLUB = "HANDBALL SAINT MEDARD D'EYRANS"

function isHome(team1: string | null): boolean {
  return !!team1?.startsWith(CLUB.substring(0, 15))
}

function matchResult(
  score1: string | number | null,
  score2: string | number | null,
  team1: string | null,
): 'win' | 'loss' | 'draw' | null {
  if (score1 == null || score2 == null) return null
  const home = isHome(team1)
  const clubScore = Number(home ? score1 : score2)
  const oppScore = Number(home ? score2 : score1)
  if (clubScore > oppScore) return 'win'
  if (clubScore < oppScore) return 'loss'
  return 'draw'
}

function formatMatch(m: Match): string {
  const home = isHome(m.team1)
  const clubScore = Number(home ? m.score1 : m.score2)
  const oppScore = Number(home ? m.score2 : m.score1)
  const opponent = (home ? m.team2 : m.team1) ?? 'Adversaire'
  const domExt = home ? 'dom.' : 'ext.'
  const competition = m.competition ?? 'Championnat'
  const result = matchResult(m.score1, m.score2, m.team1)
  const resultFr = result === 'win' ? 'victoire' : result === 'loss' ? 'défaite' : 'nul'
  return `  • ${competition} (${domExt}) : ${clubScore}–${oppScore} face à ${opponent} → ${resultFr}`
}

function formatDate(raw: Date | string | null): string {
  if (!raw) return '?'
  const d = new Date(raw)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * Groupe les matchs par week-end (lundi de la semaine ISO).
 * Retourne un tableau de { label, matches }, du plus ancien au plus récent.
 */
function groupByWeekend(matches: Match[]): Array<{ label: string; matches: Match[] }> {
  const groups: Map<string, Match[]> = new Map()
  for (const m of matches) {
    if (!m.date) continue
    const d = new Date(m.date)
    // Lundi de la semaine = clé de groupe
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ms]) => ({
      label: `Week-end du ${formatDate(key)}`,
      matches: ms,
    }))
}

// ─── prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(currentWeek: Match[], history: Match[]): string {
  const historyGroups = groupByWeekend(history)
  const currentGroups = groupByWeekend(currentWeek)

  const historySection =
    historyGroups.length > 0
      ? `## Résultats des semaines précédentes\n\n` +
        historyGroups
          .map(g => `### ${g.label}\n${g.matches.map(formatMatch).join('\n')}`)
          .join('\n\n')
      : ''

  const currentSection =
    currentGroups.length > 0
      ? `## Résultats de ce week-end\n\n` +
        currentGroups
          .map(g => `### ${g.label}\n${g.matches.map(formatMatch).join('\n')}`)
          .join('\n\n')
      : '## Ce week-end\n\nAucun résultat disponible.'

  return `Tu rédiges l'actu sportive du site web du Handball Saint-Médard d'Eyrans (HBSME), un club familial de Gironde.

**Consignes de ton :**
- Enthousiaste mais mesuré — évite les superlatifs excessifs ("brillant", "écrasé", "surclassé")
- En cas de défaite : encourageant, bienveillant, jamais défaitiste
- Valorise l'engagement des joueurs et l'esprit collectif, pas seulement les scores
- Si tu observes une progression ou une série sur plusieurs semaines, mentionne-la avec modestie (ex : "les U13 semblent trouver leur rythme" plutôt que "domination totale")
- Tu peux noter une tendance chiffrée si elle est flatteuse, sinon reste vague
- **Jamais de formule comme "HBSME a écrasé", "défaite sévère", "belle correction"**
- Langue : français, style fluide et chaleureux, pas de liste, pas de bullet points
- Longueur : 3 à 5 phrases maximum
- Illustre tes remarques par des scores concrets quand c'est pertinent (ex : "une victoire 24-18", "battus 15-22")
- Termine obligatoirement par : "Allez Saint-Médard d'Eyrans ! 🤾"

---

${historySection}

${currentSection}

---

Rédige maintenant le résumé d'actu du week-end dernier, en tenant compte du contexte des semaines précédentes si pertinent.`
}

// ─── fallback ────────────────────────────────────────────────────────────────

function fallbackText(matches: Match[]): string {
  if (matches.length === 0) {
    return 'Pas de matchs disputés ce week-end. Rendez-vous la semaine prochaine pour suivre nos équipes ! Allez Saint-Médard d\'Eyrans ! 🤾'
  }
  const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
  const total = matches.length
  return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} ${total > 1 ? 'étaient' : 'était'} au programme pour nos équipes. ${wins > 0 ? `Avec ${wins} victoire${wins > 1 ? 's' : ''} au compteur, le bilan est encourageant.` : 'Malgré des résultats difficiles, nos joueurs ont montré de la combativité.'} Retrouvez le détail dans la section Résultats. Allez Saint-Médard d'Eyrans ! 🤾`
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * @param currentWeek  matchs du week-end en cours (pour l'actu principale)
 * @param history      matchs des semaines précédentes (pour le contexte IA)
 */
export async function generateWeekendSummary(
  currentWeek: Match[],
  history: Match[],
): Promise<string> {
  if (currentWeek.length === 0) {
    return fallbackText([])
  }

  // Cache par hash de toutes les données
  const hash = computeHash(currentWeek, history)
  const cached = readCache()
  if (cached?.hash === hash) {
    return cached.text
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return fallbackText(currentWeek)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    const prompt = buildPrompt(currentWeek, history)

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    if (text) {
      writeCache({ hash, text, generatedAt: new Date().toISOString() })
      return text
    }
  } catch (err) {
    console.error('[HBSME] AI summary error:', err)
  }

  return fallbackText(currentWeek)
}
