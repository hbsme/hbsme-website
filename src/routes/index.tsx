import { createFileRoute, Link } from '@tanstack/react-router'
import { generateWeekendSummary } from '../server/ai'
import {
  formatCompetition,
  getMatchHistory,
  getPartenaires,
  getRecentResults,
  getStandings,
  getUpcomingBirthdays,
  getUpcomingMatches,
  getWeekendNews,
  isHome,
  logoUrl,
} from '../server/queries'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const [upcoming, results, standings, birthdays, weekendMatches, matchHistory, partenaires] =
      await Promise.all([
        getUpcomingMatches(),
        getRecentResults(),
        getStandings(),
        getUpcomingBirthdays(),
        getWeekendNews(),
        getMatchHistory(),
        getPartenaires(),
      ])

    // Historique = tous les matchs passés SAUF le week-end en cours
    const weekendIds = new Set(weekendMatches.map(m => m.matchId))
    const history = matchHistory.filter(m => !weekendIds.has(m.matchId))

    const weekendSummary = await generateWeekendSummary(weekendMatches, history)
    return { upcoming, results, standings, birthdays, weekendMatches, weekendSummary, partenaires }
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

/** Rendu inline de **gras** et *italique* markdown */
function FormattedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </span>
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

type TeamRow = Awaited<ReturnType<typeof getStandings>>[number]

function StandingsGroup({ label, teams }: { label: string; teams: TeamRow[] }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700">{label}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-gray-100">
            <th className="text-left px-4 py-2">#</th>
            <th className="text-left px-4 py-2">Équipe</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">J</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">G</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">N</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">P</th>
            <th className="text-center px-4 py-2 text-gray-500">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const isClub = t.team.includes('SAINT MEDARD')
            return (
              <tr
                key={t.id}
                className={`border-b border-gray-50 last:border-0 ${isClub ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-2.5 text-gray-400 text-xs">{t.score_place}</td>
                <td className={`px-4 py-2.5 font-semibold text-sm ${isClub ? 'text-pink-800' : 'text-gray-700'}`}>
                  {isClub ? 'HBSME' : teamLabel(t.team)}
                </td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_joue}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_gagne}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_nul}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_perdu}</td>
                <td className={`text-center px-4 py-2.5 font-bold text-sm ${isClub ? 'text-pink-800' : 'text-gray-800'}`}>{t.score_point}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
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
  const { upcoming, results, standings, birthdays, weekendMatches, weekendSummary, partenaires } = Route.useLoaderData()

  const sortedResults = [...results].sort((a, b) => categorySortKey(a.competition) - categorySortKey(b.competition))
  const sortedUpcoming = [...upcoming].sort((a, b) => categorySortKey(a.competition) - categorySortKey(b.competition))

  const standingGroups = standings.reduce<Record<string, TeamRow[]>>((acc, t) => {
    const label = formatCompetition(t.competition)
    if (!acc[label]) acc[label] = []
    acc[label].push(t)
    return acc
  }, {})

  const sortedStandingGroups = Object.entries(standingGroups)
    .sort(([, a], [, b]) => categorySortKey(a[0].competition) - categorySortKey(b[0].competition))

  const weekendText = weekendSummary

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-10 backdrop-blur bg-gradient-to-b from-white/95 to-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={CLUB_LOGO} alt="Logo HBSME" className="w-9 h-9 object-contain" />
            <div>
              <p className="font-black text-gray-900 leading-tight">HBSME</p>
              <p className="text-xs text-gray-400">Saint-Médard d'Eyrans</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#weekend" className="hover:text-pink-800 transition-colors">Actu</a>
            <a href="#resultats" className="hover:text-pink-800 transition-colors">Résultats</a>
            <a href="#matchs" className="hover:text-pink-800 transition-colors">Matchs</a>
            <a href="#classements" className="hover:text-pink-800 transition-colors">Classements</a>
            <a href="#anniversaires" className="hover:text-pink-800 transition-colors">Anniversaires</a>
            <Link to="/partenaires" className="hover:text-pink-800 transition-colors font-semibold">Partenaires</Link>
          </nav>
        </div>
      </header>

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
                <FormattedText text={weekendText} className="text-gray-600 leading-relaxed text-base" />
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
          <h2 className="text-2xl font-black text-gray-900 mb-6">Classements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sortedStandingGroups.map(([label, teams]) => (
              <StandingsGroup key={label} label={label} teams={teams} />
            ))}
          </div>
        </section>

      </main>

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
                  ? <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{logo}</a>
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
