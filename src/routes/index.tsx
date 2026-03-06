import { createFileRoute, Link } from '@tanstack/react-router'
import {
  formatCompetition,
  getPartenaires,
  getRecentResults,
  getTeamOverview,
  getUpcomingBirthdays,
  getUpcomingMatches,
  getWeekendNews,
  isHome,
  logoUrl,
} from '../server/queries'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const [upcoming, results, teamOverview, birthdays, weekendNews, partenaires] =
      await Promise.all([
        getUpcomingMatches(),
        getRecentResults(),
        getTeamOverview(),
        getUpcomingBirthdays(),
        getWeekendNews(),
        getPartenaires(),
      ])
    const { weekendMatches, weekendSummary } = weekendNews
    return { upcoming, results, teamOverview, birthdays, weekendMatches, weekendSummary, partenaires }
  },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

const CLUB_LOGO = '/logo-hbsme.png'

const CATEGORY_ORDER: Record<string, number> = {
  '11F': 1, '11G': 2, '13F': 3, '13G': 4, '15F': 5, '15G': 6,
  '18F': 7, '18G': 8, 'SF': 9, 'SG': 10,
}

function categorySortKey(competition: string): number {
  return CATEGORY_ORDER[teamCategory(competition)] ?? 99
}

function ordinal(n: number | null): string {
  if (!n) return '—'
  return n === 1 ? '1er' : `${n}e`
}

function formatPhase(phase: string): string {
  return phase
    .replace(/^(U\d+|[+]\s*16)\s+(MASCULIN[ES]?|F[ÉE]MININ[EES]?|FILLES?)\s*/i, '')
    .replace(/_PHASE\s*(\d+)/gi, ' Ph.$1')
    .replace(/_P(\d+)\b/gi, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ')
    .trim()
}

/** Extrait le numéro d'équipe HBSME (ex: "HBSME 1" → "1"), null si pas de numéro */
function clubTeamNumber(name: string | null): string | null {
  if (!name) return null
  const m = name.match(/HANDBALL SAINT MEDARD D'EYRANS\s+(\d+)$/i)
  return m?.[1] ?? null
}

function teamCategory(competition: string): string {
  const c = competition.replace(/^GIRONDE_/, '').toUpperCase()
  if (c.includes('+16') && c.includes('MASCUL')) return 'SG'
  if (c.includes('+16') && c.includes('FEMIN')) return 'SF'
  const age = c.match(/U(\d+)/)?.[1]
  if (!age) return ''
  if (c.includes('MASCUL')) return `${age}G`
  if (c.includes('FEMIN')) return `${age}F`
  return ''
}

function formatDate(d: Date | string | null, withTime = true) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { weekday: 'long', day: 'numeric', month: 'long' }
  return date.toLocaleDateString('fr-FR', opts)
}

function teamLabel(name: string) {
  return name
    .replace(/HANDBALL SAINT MEDARD D'EYRANS ?(\d+)?/i, (_, n) => n ? `HBSME ${n}` : 'HBSME')
    .replace(/HANDBALL /i, '')
    .replace(/CLUB /i, '')
    .trim()
}

function matchResult(score1: string | null, score2: string | null, team1: string) {
  if (!score1 || !score2) return null
  const s1 = parseInt(score1), s2 = parseInt(score2)
  const home = isHome(team1)
  const clubScore = home ? s1 : s2
  const oppScore = home ? s2 : s1
  if (clubScore > oppScore) return 'win'
  if (clubScore < oppScore) return 'loss'
  return 'draw'
}

type WeekendMatches = Awaited<ReturnType<typeof getWeekendNews>>

/** Rendu de **gras**, *italique* et paragraphes (\n\n) */
function FormattedText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  const renderInline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      return <span key={i}>{part}</span>
    })
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={`text-justify leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
          {renderInline(p)}
        </p>
      ))}
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TeamLogo({ url, alt, size = 'md' }: { url: string | null; alt: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
  const initials = alt.replace(/^(HANDBALL|HBC|HB|HA|AS|US|SH|SP|ST|STADE|CLUB|UNION|ENTENTE)\s+/i, '').substring(0, 2).toUpperCase()
  const fallback = (
    <div className={`${dim} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold shrink-0`}>
      {initials}
    </div>
  )
  if (!url) return fallback
  return (
    <img
      src={url}
      alt={alt}
      className={`${dim} rounded-full object-contain bg-white border border-gray-100 p-0.5 shrink-0`}
      onError={(e) => {
        const img = e.currentTarget
        const parent = img.parentNode
        if (parent) {
          const div = document.createElement('div')
          div.className = `${dim} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold shrink-0`
          div.textContent = initials
          parent.replaceChild(div, img)
        }
      }}
    />
  )
}

type MatchRow = Awaited<ReturnType<typeof getUpcomingMatches>>[number]

function MatchCard({ match, variant }: { match: MatchRow; variant: 'upcoming' | 'result' }) {
  const home = isHome(match.team1)
  const clubTeam = home ? match.team1 : match.team2
  const oppTeam = home ? match.team2 : match.team1
  const clubLogo = logoUrl(home ? match.logo1 : match.logo2)
  const oppLogo = logoUrl(home ? match.logo2 : match.logo1)
  const clubScore = home ? match.score1 : match.score2
  const oppScore = home ? match.score2 : match.score1
  const result = matchResult(match.score1, match.score2, match.team1)
  const category = teamCategory(match.competition)
  const teamNum = clubTeamNumber(clubTeam)
  const categoryLabel = teamNum ? `${category}${teamNum}` : category

  const resultStyle = {
    win:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', score: 'text-emerald-600', gradient: 'from-white to-emerald-50' },
    loss: { badge: 'bg-gray-50 text-gray-500 border-gray-200',          score: 'text-gray-400',    gradient: 'from-white to-gray-100' },
    draw: { badge: 'bg-amber-50 text-amber-700 border-amber-200',       score: 'text-amber-600',   gradient: 'from-white to-amber-50' },
  }
  const gradient = result ? resultStyle[result].gradient : 'from-white to-gray-100'

  // Convention : équipe qui reçoit toujours à gauche
  const left  = home
    ? { logo: clubLogo,  label: 'HBSME',              score: clubScore, bold: true  }
    : { logo: oppLogo,   label: teamLabel(oppTeam),    score: oppScore,  bold: false }
  const right = home
    ? { logo: oppLogo,   label: teamLabel(oppTeam),    score: oppScore,  bold: false }
    : { logo: clubLogo,  label: 'HBSME',              score: clubScore, bold: true  }

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow border border-gray-100 shadow-sm`}>
      {/* Header: catégorie + compétition + résultat */}
      <div className="flex items-center gap-2">
        {categoryLabel && (
          <span className="text-sm font-black text-pink-800 bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-0.5 shrink-0">
            {categoryLabel}
          </span>
        )}
        <span className="text-xs text-gray-400 truncate flex-1">{formatCompetition(match.competition)}</span>
        {result && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${resultStyle[result].badge}`}>
            {result === 'win' ? 'Victoire' : result === 'loss' ? 'Défaite' : 'Nul'}
          </span>
        )}
      </div>

      {/* Corps: logos + noms + score — équipe qui reçoit toujours à gauche */}
      <div className="flex items-center gap-3">
        {/* Équipe gauche (reçoit) */}
        <TeamLogo url={left.logo} alt={left.label} size="lg" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${left.bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>{left.label}</p>
          <p className="text-xs text-gray-400">{home ? 'Domicile' : 'Extérieur'}</p>
        </div>

        {/* Score */}
        {variant === 'result' && left.score != null && right.score != null ? (
          <div className="text-center shrink-0 px-2">
            <span className="text-2xl font-black tabular-nums">
              <span className={!home && result ? resultStyle[result].score : 'text-gray-500'}>{left.score}</span>
              <span className="text-gray-300 mx-1.5">–</span>
              <span className={home && result ? resultStyle[result].score : 'text-gray-500'}>{right.score}</span>
            </span>
          </div>
        ) : (
          <div className="text-center shrink-0 px-2">
            <span className="text-xs font-semibold text-gray-500">
              {match.date ? formatDate(match.date) : 'Date TBD'}
            </span>
          </div>
        )}

        {/* Équipe droite (se déplace) */}
        <div className="flex-1 min-w-0 text-right">
          <p className={`text-sm truncate ${right.bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>{right.label}</p>
        </div>
        <TeamLogo url={right.logo} alt={right.label} size="lg" />
      </div>

      {variant === 'result' && match.date && (
        <p className="text-xs text-gray-300 text-right">{formatDate(match.date)}</p>
      )}
    </div>
  )
}

type TeamOverviewRow = Awaited<ReturnType<typeof getTeamOverview>>[number]

function TeamsOverview({ teams }: { teams: TeamOverviewRow[] }) {
  // Compter les entrées par catégorie pour numéroter si > 1
  const countPerCat = new Map<string, number>()
  for (const t of teams) {
    const cat = teamCategory(t.competition)
    countPerCat.set(cat, (countPerCat.get(cat) ?? 0) + 1)
  }
  // Assigner un label à chaque entrée (11G ou 11G1 / 11G2)
  const indexPerCat = new Map<string, number>()
  const entries = [...teams]
    .sort((a, b) => (CATEGORY_ORDER[teamCategory(a.competition)] ?? 99) - (CATEGORY_ORDER[teamCategory(b.competition)] ?? 99))
    .map(t => {
      const cat = teamCategory(t.competition)
      const count = countPerCat.get(cat) ?? 1
      const idx = (indexPerCat.get(cat) ?? 0) + 1
      indexPerCat.set(cat, idx)
      const label = count > 1 ? `${cat}${idx}` : cat
      return { ...t, label }
    })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entries.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Barre colorée top */}
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-400" />

          {/* Header : badge + catégorie */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <span className="text-sm font-black text-pink-800 bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-0.5 shrink-0">
              {t.label}
            </span>
            <span className="text-xs text-gray-400 truncate">{formatCompetition(t.competition)}</span>
          </div>

          {/* Phase */}
          <p className="px-4 text-sm font-semibold text-gray-700 truncate">{formatPhase(t.phase)}</p>

          {/* Stats */}
          <div className="px-4 py-3 mt-1">
            {/* Classement bien visible */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-3xl font-black text-gray-900">{ordinal(t.score_place)}</span>
              <span className="text-xs text-gray-400">de la poule · {t.score_point} pts</span>
            </div>
            {/* Tableau compact J/V/N/D */}
            <div className="grid grid-cols-4 text-center text-xs rounded-xl overflow-hidden border border-gray-100">
              {(['J', 'V', 'N', 'D'] as const).map((col, i) => {
                const val = [t.score_joue, t.score_gagne, t.score_nul, t.score_perdu][i]
                return (
                  <div key={col} className={`py-2 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
                    <p className="text-gray-400 font-medium">{col}</p>
                    <p className="font-bold text-gray-700">{val ?? 0}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lien FFHB */}
          {t.url && (
            <div className="px-4 pb-4 mt-auto">
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center text-xs font-semibold text-pink-700 hover:text-white hover:bg-pink-700 border border-pink-200 hover:border-pink-700 rounded-xl py-2 transition-all"
              >
                Voir sur FFHB ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

type BirthdayRow = Awaited<ReturnType<typeof getUpcomingBirthdays>>[number]

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatName(firstname: string, lastname: string) {
  const fn = firstname.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return `${fn} ${lastname.charAt(0).toUpperCase()}.`
}

function BirthdayWeek({ birthdays, compact = false }: { birthdays: BirthdayRow[]; compact?: boolean }) {
  const today = new Date()
  // Construire J-2 → J+5 (8 jours)
  const days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 2 + i)
    return d
  })

  // Grouper les anniversaires par jour (MM-DD)
  const byDay: Record<string, BirthdayRow[]> = {}
  for (const p of birthdays) {
    const bday = new Date(p.birthdate)
    const key = `${String(bday.getMonth() + 1).padStart(2, '0')}-${String(bday.getDate()).padStart(2, '0')}`
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(p)
  }

  const px = compact ? 'px-3' : 'px-4'
  const py = compact ? 'py-1.5' : 'py-3'
  const badgeSize = compact ? 'w-10' : 'w-12'

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'}>
      {days.map((d, i) => {
        const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const people = byDay[key] || []
        const isToday = i === 2  // index 2 = today (après J-2, J-1)
        const isPast = i < 2

        return (
          <div
            key={key}
            className={`flex items-center gap-3 ${px} ${py} border-b border-gray-50 last:border-0 ${isToday ? 'bg-pink-50' : isPast ? 'opacity-50' : ''}`}
          >
            {/* Badge date */}
            <div className={`rounded-lg px-2 py-1 shrink-0 flex items-center gap-1 ${isToday ? 'bg-pink-700 text-white' : isPast ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <span className="text-xs font-semibold">{DAYS_FR[d.getDay()]}</span>
              <span className={`${compact ? 'text-sm' : 'text-base'} font-black ${isToday ? 'text-white' : 'text-gray-700'}`}>{d.getDate()}</span>
            </div>

            {/* Noms */}
            <div className="flex-1 min-w-0">
              {people.length === 0 ? (
                <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-300`}>—</span>
              ) : (
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${isToday ? 'text-pink-900' : isPast ? 'text-gray-400 line-through' : 'text-gray-700'} truncate block`}>
                  {isToday && '🎉 '}{people.map(p => formatName(p.firstname, p.lastname)).join(', ')}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── upcoming match groups ─────────────────────────────────────────────────────

type MatchGroup = { label: string; highlight: boolean; matches: MatchRow[] }

function UpcomingMatchGroups({ matches }: { matches: MatchRow[] }) {
  // Grouper par (jour semaine, domicile/extérieur)
  // Ordre prioritaire : Sam dom > Sam ext > Dim dom > Dim ext > autres
  const GROUP_ORDER: Record<string, number> = {
    'sam-home': 0, 'sam-away': 1, 'dim-home': 2, 'dim-away': 3,
  }

  const grouped: Record<string, MatchRow[]> = {}
  for (const m of matches) {
    const day = m.date ? new Date(m.date).getDay() : -1 // 0=dim, 6=sam
    const home = isHome(m.team1)
    let key: string
    if (day === 6) key = home ? 'sam-home' : 'sam-away'
    else if (day === 0) key = home ? 'dim-home' : 'dim-away'
    else key = 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  }

  const LABELS: Record<string, string> = {
    'sam-home': 'Samedi · Domicile',
    'sam-away': 'Samedi · Extérieur',
    'dim-home': 'Dimanche · Domicile',
    'dim-away': 'Dimanche · Extérieur',
    'other': 'Autres dates',
  }

  const groups: MatchGroup[] = Object.entries(grouped)
    .sort(([a], [b]) => (GROUP_ORDER[a] ?? 99) - (GROUP_ORDER[b] ?? 99))
    .map(([key, ms]) => ({
      label: LABELS[key] ?? key,
      highlight: key === 'sam-home',
      matches: ms,
    }))

  return (
    <div className="space-y-12">
      {groups.map(({ label, highlight, matches: ms }) => (
        <div key={label}>
          <AirportBoard label={label} matches={ms} dark={highlight} />
        </div>
      ))}
    </div>
  )
}

function AirportBoard({ label, matches, dark = false }: { label: string; matches: MatchRow[]; dark?: boolean }) {
  // Extraire la date du premier match pour l'afficher dans le header
  const firstDate = matches[0]?.date ? new Date(matches[0].date) : null
  const dateLabel = firstDate
    ? firstDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : label

  const t = dark ? {
    wrap:       'shadow-2xl',
    header:     'bg-slate-900',
    headerText: 'text-white',
    headerSub:  'text-slate-400',
    dot:        'bg-pink-500',
    colHead:    'bg-slate-800 text-slate-500',
    rowEven:    'bg-slate-950',
    rowOdd:     'bg-slate-900/50',
    rowHover:   'hover:bg-slate-800/80',
    divider:    'divide-slate-800/60',
    time:       'text-amber-400',
    catText:    'text-pink-400',
    catBg:      'bg-pink-950/60 border-pink-800/50',
    teamText:   'text-white',
    oppText:    'text-slate-300',
    oppLogoBg:  'bg-white/5',
    oppPlaceholder: 'bg-slate-700',
    footer:     'bg-slate-900',
    footerText: 'text-slate-600',
  } : {
    wrap:       'shadow-md border border-gray-200',
    header:     'bg-gray-100',
    headerText: 'text-gray-800',
    headerSub:  'text-gray-400',
    dot:        'bg-pink-400',
    colHead:    'bg-gray-50 text-gray-400',
    rowEven:    'bg-white',
    rowOdd:     'bg-gray-50/70',
    rowHover:   'hover:bg-pink-50/40',
    divider:    'divide-gray-100',
    time:       'text-pink-700',
    catText:    'text-pink-700',
    catBg:      'bg-pink-50 border-pink-200',
    teamText:   'text-gray-900',
    oppText:    'text-gray-500',
    oppLogoBg:  'bg-gray-100',
    oppPlaceholder: 'bg-gray-200',
    footer:     'bg-gray-50',
    footerText: 'text-gray-400',
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${t.wrap}`}>
      {/* Header panneau */}
      <div className={`${t.header} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${t.dot} ${dark ? 'animate-pulse' : ''}`} />
          <span className={`${t.headerText} font-black text-sm tracking-widest uppercase`}>{dateLabel}</span>
        </div>
        <span className={`${t.headerSub} text-xs tracking-widest uppercase font-mono`}>
          {dark ? 'Gymnase HBSME' : 'Extérieur'}
        </span>
      </div>

      {/* Colonnes header */}
      <div className={`${t.colHead} px-5 py-2 grid grid-cols-[5rem_3rem_1fr_1fr] gap-4 text-xs font-bold tracking-widest uppercase`}>
        <span>Heure</span>
        <span>Cat.</span>
        <span>Équipe</span>
        <span>Adversaire</span>
      </div>

      {/* Lignes matchs */}
      <div className={`divide-y ${t.divider}`}>
        {matches.map((m, i) => {
          const home = isHome(m.team1)
          const clubTeam = home ? m.team1 : m.team2
          const oppTeam = home ? m.team2 : m.team1
          const oppLogo = logoUrl(home ? m.logo2 : m.logo1)
          const teamNum = clubTeamNumber(clubTeam)
          const categoryLabel = teamNum ? `${teamCategory(m.competition)}${teamNum}` : teamCategory(m.competition)
          const time = m.date
            ? new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : '—:—'

          return (
            <div
              key={m.id}
              className={`px-5 py-4 grid grid-cols-[5rem_3rem_1fr_1fr] gap-4 items-center ${i % 2 === 0 ? t.rowEven : t.rowOdd} ${t.rowHover} transition-colors`}
            >
              <span className={`${t.time} font-mono font-bold text-lg tabular-nums`}>{time}</span>

              {categoryLabel ? (
                <span className={`text-xs font-black ${t.catText} ${t.catBg} border rounded px-1.5 py-0.5 text-center w-fit`}>
                  {categoryLabel}
                </span>
              ) : <span />}

              <div className="flex items-center gap-2 min-w-0">
                <img src="/logo-hbsme.png" alt="HBSME" className="w-7 h-7 object-contain shrink-0 opacity-90" />
                <span className={`${t.teamText} font-bold text-sm truncate`}>HBSME</span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {oppLogo ? (
                  <img src={oppLogo} alt="" className={`w-7 h-7 object-contain shrink-0 ${t.oppLogoBg} rounded-full p-0.5`}
                    onError={(e) => {
                      const img = e.currentTarget
                      const parent = img.parentNode
                      if (parent) {
                        const div = document.createElement('div')
                        div.className = `w-7 h-7 rounded-full ${t.oppPlaceholder} shrink-0 flex items-center justify-center text-xs font-bold text-gray-400`
                        div.textContent = teamLabel(oppTeam).replace(/^(HBC|HB|AS|US|SP|ST|STADE|UNION)\s+/i, '').substring(0, 2).toUpperCase()
                        parent.replaceChild(div, img)
                      }
                    }} />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${t.oppPlaceholder} shrink-0`} />
                )}
                <span className={`${t.oppText} font-medium text-sm truncate`}>{teamLabel(oppTeam)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className={`${t.footer} px-5 py-2 text-right`}>
        <span className={`${t.footerText} text-xs font-mono`}>HBSME · {matches.length} rencontre{matches.length > 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function Home() {
  const { upcoming, results, teamOverview, birthdays, weekendMatches, weekendSummary, partenaires } = Route.useLoaderData()

  const sortedResults = [...results].sort((a, b) => categorySortKey(a.competition) - categorySortKey(b.competition))
  const sortedUpcoming = [...upcoming].sort((a, b) => categorySortKey(a.competition) - categorySortKey(b.competition))
  const weekendText = weekendSummary

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}

      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-white to-pink-50 border-b border-pink-100 pb-10">
        <div className="max-w-6xl mx-auto px-4 pt-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-pink-700 text-sm font-bold tracking-widest uppercase mb-3">
              Handball Club · Gironde
            </p>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none text-gray-900">
              Handball<br />
              <span className="text-pink-700">Saint-Médard</span><br />
              d'Eyrans
            </h1>
            <p className="text-gray-500 text-base max-w-lg leading-relaxed mb-3">
              L'histoire du HBSME débute avec la construction d'une nouvelle salle multisports
              dans notre village. C'est l'idée de Patrice Ragon, habitant de la commune et
              joueur de longue date, de créer une association de handball avec quelques amis.
              C'est ainsi que naît le club.
            </p>
            <p className="text-gray-400 text-base max-w-lg leading-relaxed">
              Depuis 2014, le club a grandi grâce à l'implication de tous — bénévoles, parents,
              licenciés, dirigeants, partenaires, entraîneurs. Un club axé sur la formation
              du joueur, avec la convivialité comme identité.
            </p>
          </div>
          <div className="shrink-0">
            <img src={CLUB_LOGO} alt="Logo HBSME" className="w-48 h-48 object-contain drop-shadow-xl" />
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pt-10 pb-16 space-y-20">

        {/* Actu du week-end + card anniversaire côte à côte */}
        <section id="weekend" className="pb-20 border-b border-gray-200">
          <div className="flex gap-16 items-start">

            {/* Actu — prend tout l'espace disponible */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-black text-gray-900">Actu du week-end</h2>
                <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 bg-white">
                  ✦ Résumé automatique
                </span>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <FormattedText text={weekendText} className="text-gray-600 text-base" />
                {weekendMatches.length > 0 && (
                  <p className="text-xs text-gray-300 mt-4">
                    Basé sur {weekendMatches.length} match{weekendMatches.length > 1 ? 's' : ''} du week-end.
                  </p>
                )}
              </div>
            </div>

            {/* Card anniversaire — taille fixe, punaisée */}
            <div className="relative w-52 shrink-0 hidden md:block mt-10" id="anniversaires">
              {/* Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
                <div className="w-6 h-6 rounded-full bg-pink-700 border-2 border-pink-800 shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white opacity-60" />
                </div>
              </div>
              {/* Carte — rotation autour du pin (origin-top) */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden rotate-1 hover:rotate-0 origin-top transition-transform duration-300">
                <div className="bg-gradient-to-b from-pink-600 to-pink-800 px-3 py-2 text-center">
                  <p className="text-white text-xs font-black tracking-widest uppercase">🎂 Anniversaires</p>
                </div>
                <BirthdayWeek birthdays={birthdays} compact />
              </div>
            </div>

          </div>
        </section>

        {/* Résultats récents */}
        <section id="resultats">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Derniers résultats</h2>
          {sortedResults.length === 0 ? (
            <p className="text-gray-400">Aucun résultat disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedResults.map((m) => <MatchCard key={m.id} match={m} variant="result" />)}
            </div>
          )}
        </section>

        {/* Prochains matchs */}
        <section id="matchs">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Prochains matchs</h2>
          {sortedUpcoming.length === 0 ? (
            <p className="text-gray-400">Aucun match à venir renseigné.</p>
          ) : (
            <UpcomingMatchGroups matches={sortedUpcoming} />
          )}
        </section>

        {/* Classements */}
        <section id="classements">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Nos équipes</h2>
          <TeamsOverview teams={teamOverview} />
        </section>

      </main>

      {/* Galerie photo — strip défilant */}
      <section className="py-12 overflow-hidden bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vie du club</h2>
            <p className="text-sm text-gray-500 mt-1">Moments partagés sur et hors du terrain</p>
          </div>
          <a
            href="/galerie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            Voir toute la galerie →
          </a>
        </div>
        <div className="relative">
          <div
            className="flex gap-4 px-4"
            style={{
              animation: 'gallery-scroll 90s linear infinite',
              width: 'max-content',
            }}
          >
          <img key="0" src="/gallery/thumb/IMG_6387.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="1" src="/gallery/thumb/DSC8261.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="2" src="/gallery/thumb/20240518_190303.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="3" src="/gallery/thumb/DSC8435.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="4" src="/gallery/thumb/2024-05-29_16.52.12_2d7a61a4.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="5" src="/gallery/thumb/20231014_120234.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="6" src="/gallery/thumb/DSC8273.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="7" src="/gallery/thumb/IMG-20211112-WA0006.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="8" src="/gallery/thumb/DSC8296.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="9" src="/gallery/thumb/IMG_9086.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="10" src="/gallery/thumb/IMG-20220602-WA0003.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="11" src="/gallery/thumb/DSC8271.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="12" src="/gallery/thumb/IMG_3803.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="13" src="/gallery/thumb/IMG_7225.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="14" src="/gallery/thumb/DSC8475.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="15" src="/gallery/thumb/DSC8260.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="16" src="/gallery/thumb/20231009_211324.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="17" src="/gallery/thumb/IMG_9242.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="18" src="/gallery/thumb/DSC8444.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="19" src="/gallery/thumb/DSC9652.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="20" src="/gallery/thumb/IMG_9230.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="21" src="/gallery/thumb/IMG_9156.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="22" src="/gallery/thumb/IMG_7312.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="23" src="/gallery/thumb/DSC8484.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="24" src="/gallery/thumb/IMG_3279.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="25" src="/gallery/thumb/20221125_225023.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="26" src="/gallery/thumb/IMG_6426.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="27" src="/gallery/thumb/20221126_130620.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="28" src="/gallery/thumb/20240518_183456.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="29" src="/gallery/thumb/IMG_7248.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="30" src="/gallery/thumb/IMG_6387.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="31" src="/gallery/thumb/DSC8261.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="32" src="/gallery/thumb/20240518_190303.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="33" src="/gallery/thumb/DSC8435.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="34" src="/gallery/thumb/2024-05-29_16.52.12_2d7a61a4.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="35" src="/gallery/thumb/20231014_120234.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="36" src="/gallery/thumb/DSC8273.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="37" src="/gallery/thumb/IMG-20211112-WA0006.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="38" src="/gallery/thumb/DSC8296.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="39" src="/gallery/thumb/IMG_9086.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="40" src="/gallery/thumb/IMG-20220602-WA0003.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="41" src="/gallery/thumb/DSC8271.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="42" src="/gallery/thumb/IMG_3803.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="43" src="/gallery/thumb/IMG_7225.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="44" src="/gallery/thumb/DSC8475.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="45" src="/gallery/thumb/DSC8260.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="46" src="/gallery/thumb/20231009_211324.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="47" src="/gallery/thumb/IMG_9242.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="48" src="/gallery/thumb/DSC8444.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="49" src="/gallery/thumb/DSC9652.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="50" src="/gallery/thumb/IMG_9230.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="51" src="/gallery/thumb/IMG_9156.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="52" src="/gallery/thumb/IMG_7312.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="53" src="/gallery/thumb/DSC8484.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="54" src="/gallery/thumb/IMG_3279.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="55" src="/gallery/thumb/20221125_225023.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="56" src="/gallery/thumb/IMG_6426.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="57" src="/gallery/thumb/20221126_130620.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="58" src="/gallery/thumb/20240518_183456.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          <img key="59" src="/gallery/thumb/IMG_7248.jpg" alt="HBSME" className="h-52 w-auto object-cover rounded-xl flex-shrink-0 shadow-sm" loading="lazy" />
          </div>
        </div>
      </section>
      {/* Partenaires */}
      {partenaires.length > 0 && (
        <section className="border-t border-gray-100 bg-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-sm text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Notre club de handball s'épanouit grâce au soutien de partenaires dynamiques et engagés.
              Leurs contributions nous permettent d'offrir à nos licenciés un environnement sportif de qualité
              et d'organiser des événements fédérateurs.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {partenaires.map((p) => {
                const logo = (
                  <img
                    key={p.id}
                    src={`/partenaires/${p.logo}`}
                    alt={p.name}
                    title={p.name}
                    className="h-10 max-w-[120px] object-contain opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                )
                return p.url
                  ? <a key={p.id} href={p.url} >{logo}</a>
                  : logo
              })}
            </div>
            <p className="text-center mt-6">
              <Link to="/partenaires" className="text-xs text-gray-400 hover:text-pink-700 transition-colors">
                Voir tous nos partenaires →
              </Link>
            </p>
          </div>
        </section>
      )}

      <footer className="border-t border-gray-100 bg-white py-10 text-center text-gray-300 text-sm">
        <p className="font-bold text-gray-400 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} · Données FFHB &amp; Gesthand</p>
      </footer>

    </div>
  )
}
