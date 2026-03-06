
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

function groupByWeekend(matches: Match[]): Array<{ label: string; matches: Match[] }> {
  const groups: Map<string, Match[]> = new Map()
  for (const m of matches) {
    if (!m.date) continue
    const d = new Date(m.date)
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

  const hasCurrentWeek = currentGroups.length > 0
  const currentSection = hasCurrentWeek
    ? `## Résultats de ce week-end\n\n` +
      currentGroups
        .map(g => `### ${g.label}\n${g.matches.map(formatMatch).join('\n')}`)
        .join('\n\n')
    : '## Ce week-end\n\nHBSME n\'avait pas de rencontres ce week-end.'

  const taskInstruction = hasCurrentWeek
    ? 'Rédige maintenant le résumé d\'actu du week-end dernier, en tenant compte du contexte des semaines précédentes si pertinent.'
    : 'Il n\'y avait pas de match ce week-end. Rédige un court message (2-3 phrases) qui mentionne cette pause, et fait un bref rappel positif des résultats récents si pertinent.'

  return `Tu rédiges l'actu sportive du site web du Handball Saint-Médard d'Eyrans (HBSME), un club familial de Gironde.

**Consignes de ton :**
- Enthousiaste mais mesuré — évite les superlatifs excessifs ("brillant", "écrasé", "surclassé")
- En cas de défaite : encourageant, bienveillant, jamais défaitiste
- Valorise l'engagement des joueurs et l'esprit collectif, pas seulement les scores
- Si tu observes une progression ou une série sur plusieurs semaines, mentionne-la avec modestie
- **Jamais de formule comme "HBSME a écrasé", "défaite sévère", "belle correction"**
- Langue : français, style fluide et chaleureux, pas de liste, pas de bullet points
- Longueur : 3 à 5 phrases, réparties en 2 paragraphes séparés par une ligne vide (\`\`\\n\\n\`\`)
- Formate avec du markdown minimal : catégories en gras (ex : **U11**, **U13**) et scores en italique (ex : *35-25*)
- Illustre tes remarques par des scores concrets quand c'est pertinent
- Termine obligatoirement par : "Allez Saint-Médard d'Eyrans ! 🤾"

---

${historySection}

${currentSection}

---

${taskInstruction}`
}

// ─── fallback ────────────────────────────────────────────────────────────────

function fallbackText(matches: Match[]): string {
  if (matches.length === 0) {
    return "Pas de matchs disputés ce week-end. Rendez-vous la semaine prochaine pour suivre nos équipes ! Allez Saint-Médard d'Eyrans ! 🤾"
  }
  const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
  const total = matches.length
  return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} ${total > 1 ? 'étaient' : 'était'} au programme pour nos équipes. ${wins > 0 ? `Avec ${wins} victoire${wins > 1 ? 's' : ''} au compteur, le bilan est encourageant.` : 'Malgré des résultats difficiles, nos joueurs ont montré de la combativité.'} Allez Saint-Médard d'Eyrans ! 🤾`
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generateWeekendSummary(
  currentWeek: Match[],
  history: Match[],
): Promise<string> {
  if (currentWeek.length === 0 && history.length === 0) {
    return fallbackText([])
  }

  // Imports Node.js lazy (server only)
  const { createHash } = await import('crypto')
  const { existsSync, readFileSync, writeFileSync } = await import('fs')
  const { tmpdir } = await import('os')
  const { join } = await import('path')
  const CACHE_FILE = join(tmpdir(), 'hbsme_weekend_summary.json')

  const all = [...currentWeek, ...history]
  const stable = all.map(m => [m.matchId, m.score1, m.score2].join(":")).sort().join("|")
  const hash = createHash('sha256').update(stable).digest('hex').slice(0, 16)

  let cached: CacheEntry | null = null
  try {
    if (existsSync(CACHE_FILE)) cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as CacheEntry
  } catch { /* ignore */ }
  if (cached?.hash === hash) return cached.text

  const _writeCache = (entry: CacheEntry) => {
    try { writeFileSync(CACHE_FILE, JSON.stringify(entry), 'utf-8') } catch { /* ignore */ }
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return fallbackText(currentWeek)
  }

  try {
    const prompt = buildPrompt(currentWeek, history)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    if (!res.ok) throw new Error(`Gemini API ${res.status}`)
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    if (text) {
      _writeCache({ hash, text, generatedAt: new Date().toISOString() })
      return text
    }
  } catch (err) {
    console.error('[HBSME] AI summary error:', err)
  }

  return fallbackText(currentWeek)
}
