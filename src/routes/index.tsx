import { createFileRoute } from '@tanstack/react-router'
import {
  formatCompetition,
  getRecentResults,
  getStandings,
  getUpcomingMatches,
  isHome,
  logoUrl,
} from '../server/queries'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const [upcoming, results, standings] = await Promise.all([
      getUpcomingMatches(),
      getRecentResults(),
      getStandings(),
    ])
    return { upcoming, results, standings }
  },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function teamLabel(name: string) {
  return name
    .replace(/HANDBALL SAINT MEDARD D'EYRANS ?/i, 'HBSME')
    .replace(/HANDBALL /i, '')
    .replace(/CLUB /i, '')
    .replace(/\b(\d+)$/, '($1)')
    .trim()
}

function matchResult(score1: string | null, score2: string | null, team1: string) {
  if (!score1 || !score2) return null
  const s1 = parseInt(score1)
  const s2 = parseInt(score2)
  const home = isHome(team1)
  const clubScore = home ? s1 : s2
  const oppScore = home ? s2 : s1
  if (clubScore > oppScore) return 'win'
  if (clubScore < oppScore) return 'loss'
  return 'draw'
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TeamLogo({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
        {alt.substring(0, 2)}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shrink-0"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
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

  const resultColor = {
    win: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    loss: 'bg-red-500/20 text-red-400 border-red-500/30',
    draw: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:bg-slate-700/80 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 truncate">
          {formatCompetition(match.competition)}
        </span>
        {result && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${resultColor[result]}`}>
            {result === 'win' ? 'V' : result === 'loss' ? 'D' : 'N'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <TeamLogo url={clubLogo} alt={teamLabel(clubTeam)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{teamLabel(clubTeam)}</p>
          <p className="text-xs text-slate-400">{home ? 'Domicile' : 'Extérieur'}</p>
        </div>
        {variant === 'result' && clubScore != null && oppScore != null ? (
          <div className="text-center shrink-0">
            <span className="text-2xl font-black text-white tabular-nums">
              {clubScore}
              <span className="text-slate-500 mx-1">–</span>
              {oppScore}
            </span>
          </div>
        ) : (
          <div className="text-center shrink-0 text-slate-400 font-semibold text-sm">
            {match.date ? formatDate(match.date) : 'Date TBD'}
          </div>
        )}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-slate-300 truncate">{teamLabel(oppTeam)}</p>
        </div>
        <TeamLogo url={oppLogo} alt={teamLabel(oppTeam)} />
      </div>

      {variant === 'result' && match.date && (
        <p className="text-xs text-slate-500 text-right">{formatDate(match.date)}</p>
      )}
    </div>
  )
}

type TeamRow = Awaited<ReturnType<typeof getStandings>>[number]

function StandingsGroup({ label, teams }: { label: string; teams: TeamRow[] }) {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-700/50">
        <h3 className="text-sm font-bold text-slate-200">{label}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 border-b border-slate-700">
            <th className="text-left px-4 py-2">#</th>
            <th className="text-left px-4 py-2">Équipe</th>
            <th className="text-center px-2 py-2">J</th>
            <th className="text-center px-2 py-2">G</th>
            <th className="text-center px-2 py-2">N</th>
            <th className="text-center px-2 py-2">P</th>
            <th className="text-center px-4 py-2 font-bold text-slate-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const isClub = t.team.includes('SAINT MEDARD')
            return (
              <tr
                key={t.id}
                className={`border-b border-slate-700/50 last:border-0 ${isClub ? 'bg-blue-600/10' : ''}`}
              >
                <td className="px-4 py-2.5 text-slate-400">{t.score_place}</td>
                <td className={`px-4 py-2.5 font-medium ${isClub ? 'text-blue-400' : 'text-slate-300'}`}>
                  {isClub ? 'HBSME' : teamLabel(t.team)}
                </td>
                <td className="text-center px-2 py-2.5 text-slate-400">{t.score_joue}</td>
                <td className="text-center px-2 py-2.5 text-slate-400">{t.score_gagne}</td>
                <td className="text-center px-2 py-2.5 text-slate-400">{t.score_nul}</td>
                <td className="text-center px-2 py-2.5 text-slate-400">{t.score_perdu}</td>
                <td className="text-center px-4 py-2.5 font-bold text-white">{t.score_point}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function Home() {
  const { upcoming, results, standings } = Route.useLoaderData()

  // Group standings by competition label
  const standingGroups = standings.reduce<Record<string, TeamRow[]>>((acc, t) => {
    const label = formatCompetition(t.competition)
    if (!acc[label]) acc[label] = []
    acc[label].push(t)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm">
              HB
            </div>
            <div>
              <p className="font-bold text-white leading-tight">HBSME</p>
              <p className="text-xs text-slate-400">Saint-Médard d'Eyrans</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#resultats" className="hover:text-white transition-colors">Résultats</a>
            <a href="#matchs" className="hover:text-white transition-colors">Matchs</a>
            <a href="#classements" className="hover:text-white transition-colors">Classements</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">
          Handball Club
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          Handball<br />
          <span className="text-blue-500">Saint-Médard</span><br />
          d'Eyrans
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Suivez l'actualité de nos équipes — résultats, prochains matchs et classements.
        </p>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-20 space-y-16">

        {/* Résultats récents */}
        <section id="resultats">
          <h2 className="text-2xl font-black mb-6">
            Derniers résultats
          </h2>
          {results.length === 0 ? (
            <p className="text-slate-500">Aucun résultat disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((m) => (
                <MatchCard key={m.id} match={m} variant="result" />
              ))}
            </div>
          )}
        </section>

        {/* Prochains matchs */}
        <section id="matchs">
          <h2 className="text-2xl font-black mb-6">
            Prochains matchs
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-slate-500">Aucun match à venir dans la base de données.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} variant="upcoming" />
              ))}
            </div>
          )}
        </section>

        {/* Classements */}
        <section id="classements">
          <h2 className="text-2xl font-black mb-6">
            Classements
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(standingGroups).map(([label, teams]) => (
              <StandingsGroup key={label} label={label} teams={teams} />
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        © {new Date().getFullYear()} Handball Saint-Médard d'Eyrans · Données FFHB
      </footer>
    </div>
  )
}
