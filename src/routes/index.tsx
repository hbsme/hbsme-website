import { createFileRoute } from '@tanstack/react-router'
import {
  formatCompetition,
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
    const [upcoming, results, standings, birthdays, weekendMatches] = await Promise.all([
      getUpcomingMatches(),
      getRecentResults(),
      getStandings(),
      getUpcomingBirthdays(),
      getWeekendNews(),
    ])
    return { upcoming, results, standings, birthdays, weekendMatches }
  },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

const CLUB_LOGO = '/logo-hbsme.png'

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
  const s1 = parseInt(score1)
  const s2 = parseInt(score2)
  const home = isHome(team1)
  const clubScore = home ? s1 : s2
  const oppScore = home ? s2 : s1
  if (clubScore > oppScore) return 'win'
  if (clubScore < oppScore) return 'loss'
  return 'draw'
}

function generateWeekendText(matches: Awaited<ReturnType<typeof getWeekendMatches>>) {
  // TODO: Remplacer par un vrai appel IA (ex: OpenAI) avec les matchs en contexte
  if (matches.length === 0) {
    return "Pas de matchs disputés ce week-end. Rendez-vous la semaine prochaine pour suivre nos équipes !"
  }
  const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
  const total = matches.length
  const teamNames = [...new Set(matches.map(m =>
    isHome(m.team1) ? teamLabel(m.team1) : teamLabel(m.team2)
  ))].join(', ')

  // Placeholder narratif simple
  return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} étai${total > 1 ? 'ent' : 't'} au programme pour nos équipes. ${wins > 0 ? `Avec ${wins} victoire${wins > 1 ? 's' : ''} au compteur, le bilan est encourageant.` : 'Malgré des résultats difficiles, nos joueurs ont montré de la combativité.'} Retrouvez le détail des scores dans la section Résultats. Allez Saint-Médard ! 🤾`
}

type WeekendMatches = Awaited<ReturnType<typeof getWeekendNews>>

// Référence locale pour le helper standalone
function getWeekendMatches(m: WeekendMatches) { return m }

// ─── sub-components ───────────────────────────────────────────────────────────

function TeamLogo({ url, alt, size = 'md' }: { url: string | null; alt: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  if (!url) {
    return (
      <div className={`${dim} rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold shrink-0`}>
        {alt.substring(0, 2)}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      className={`${dim} rounded-full object-contain bg-white p-0.5 shrink-0`}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
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

  const resultBadge = {
    win: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    loss: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
    draw: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3 hover:bg-zinc-800/80 transition-colors border border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500 truncate">{formatCompetition(match.competition)}</span>
        {result && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${resultBadge[result]}`}>
            {result === 'win' ? 'Victoire' : result === 'loss' ? 'Défaite' : 'Nul'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <TeamLogo url={clubLogo} alt={teamLabel(clubTeam)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{teamLabel(clubTeam)}</p>
          <p className="text-xs text-zinc-500">{home ? 'Domicile' : 'Extérieur'}</p>
        </div>

        {variant === 'result' && clubScore != null && oppScore != null ? (
          <div className="text-center shrink-0 px-2">
            <span className="text-2xl font-black tabular-nums">
              <span className={result === 'win' ? 'text-rose-400' : 'text-white'}>{clubScore}</span>
              <span className="text-zinc-600 mx-1.5">–</span>
              <span className="text-zinc-400">{oppScore}</span>
            </span>
          </div>
        ) : (
          <div className="text-center shrink-0 px-2">
            <span className="text-xs font-semibold text-zinc-400">
              {match.date ? formatDate(match.date) : 'Date TBD'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-zinc-300 truncate">{teamLabel(oppTeam)}</p>
        </div>
        <TeamLogo url={oppLogo} alt={teamLabel(oppTeam)} />
      </div>

      {variant === 'result' && match.date && (
        <p className="text-xs text-zinc-600 text-right">{formatDate(match.date)}</p>
      )}
    </div>
  )
}

type TeamRow = Awaited<ReturnType<typeof getStandings>>[number]

function StandingsGroup({ label, teams }: { label: string; teams: TeamRow[] }) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-200">{label}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-600 border-b border-zinc-800">
            <th className="text-left px-4 py-2">#</th>
            <th className="text-left px-4 py-2">Équipe</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">J</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">G</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">N</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">P</th>
            <th className="text-center px-4 py-2 text-zinc-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const isClub = t.team.includes('SAINT MEDARD')
            return (
              <tr
                key={t.id}
                className={`border-b border-zinc-800/50 last:border-0 transition-colors ${isClub ? 'bg-rose-500/5' : 'hover:bg-zinc-800/30'}`}
              >
                <td className="px-4 py-2.5 text-zinc-500 text-xs">{t.score_place}</td>
                <td className={`px-4 py-2.5 font-semibold text-sm ${isClub ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {isClub ? 'HBSME' : teamLabel(t.team)}
                </td>
                <td className="text-center px-2 py-2.5 text-zinc-500 text-xs hidden sm:table-cell">{t.score_joue}</td>
                <td className="text-center px-2 py-2.5 text-zinc-500 text-xs hidden sm:table-cell">{t.score_gagne}</td>
                <td className="text-center px-2 py-2.5 text-zinc-500 text-xs hidden sm:table-cell">{t.score_nul}</td>
                <td className="text-center px-2 py-2.5 text-zinc-500 text-xs hidden sm:table-cell">{t.score_perdu}</td>
                <td className={`text-center px-4 py-2.5 font-bold text-sm ${isClub ? 'text-rose-400' : 'text-white'}`}>{t.score_point}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type BirthdayRow = Awaited<ReturnType<typeof getUpcomingBirthdays>>[number]

function BirthdayCard({ person }: { person: BirthdayRow }) {
  const today = new Date()
  const bday = new Date(person.birthdate)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  const isToday = thisYear.toDateString() === today.toDateString()
  const age = today.getFullYear() - bday.getFullYear()

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${isToday ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
      <span className="text-xl">{isToday ? '🎉' : '🎂'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold capitalize truncate ${isToday ? 'text-rose-300' : 'text-zinc-200'}`}>
          {person.firstname.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} {person.lastname.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </p>
        <p className="text-xs text-zinc-500">{age} ans · {formatDate(person.birthdate, false)}</p>
      </div>
      {isToday && <span className="text-xs font-bold text-rose-400 shrink-0">Aujourd'hui !</span>}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function Home() {
  const { upcoming, results, standings, birthdays, weekendMatches } = Route.useLoaderData()

  const standingGroups = standings.reduce<Record<string, TeamRow[]>>((acc, t) => {
    const label = formatCompetition(t.competition)
    if (!acc[label]) acc[label] = []
    acc[label].push(t)
    return acc
  }, {})

  const weekendText = generateWeekendText(weekendMatches)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <header className="border-b border-zinc-900 sticky top-0 z-10 backdrop-blur bg-zinc-950/90">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={CLUB_LOGO}
              alt="Logo HBSME"
              className="w-9 h-9 rounded-full object-contain bg-white p-0.5"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement
                el.style.display = 'none'
                el.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center font-black text-xs hidden">
              HB
            </div>
            <div>
              <p className="font-black text-white leading-tight">HBSME</p>
              <p className="text-xs text-zinc-500">Saint-Médard d'Eyrans</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#weekend" className="hover:text-white transition-colors">Actu</a>
            <a href="#resultats" className="hover:text-white transition-colors">Résultats</a>
            <a href="#matchs" className="hover:text-white transition-colors">Matchs</a>
            <a href="#classements" className="hover:text-white transition-colors">Classements</a>
            <a href="#anniversaires" className="hover:text-white transition-colors">Anniversaires</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <p className="text-rose-500 text-sm font-bold tracking-widest uppercase mb-3">
            Handball Club · Gironde
          </p>
          <h1 className="text-5xl md:text-7xl font-black mb-5 leading-none">
            Handball<br />
            <span className="text-rose-500">Saint-Médard</span><br />
            d'Eyrans
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
            Le HBSME regroupe des équipes de tous âges, du baby-handball aux seniors.
            Fondé dans le cœur de la Gironde, le club forme et compétit en championnat
            départemental depuis de nombreuses saisons.
          </p>
        </div>
        <div className="shrink-0">
          <img
            src={CLUB_LOGO}
            alt="Logo HBSME"
            className="w-48 h-48 object-contain drop-shadow-2xl"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
            }}
          />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-24 space-y-20">

        {/* Actu du week-end */}
        <section id="weekend">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black">Actu du week-end</h2>
            <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
              ✦ Résumé automatique
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-300 leading-relaxed text-base">{weekendText}</p>
            {weekendMatches.length > 0 && (
              <p className="text-xs text-zinc-600 mt-4">
                Basé sur {weekendMatches.length} match{weekendMatches.length > 1 ? 's' : ''} du week-end.
              </p>
            )}
          </div>
        </section>

        {/* Résultats récents */}
        <section id="resultats">
          <h2 className="text-2xl font-black mb-6">Derniers résultats</h2>
          {results.length === 0 ? (
            <p className="text-zinc-500">Aucun résultat disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((m) => <MatchCard key={m.id} match={m} variant="result" />)}
            </div>
          )}
        </section>

        {/* Prochains matchs */}
        <section id="matchs">
          <h2 className="text-2xl font-black mb-6">Prochains matchs</h2>
          {upcoming.length === 0 ? (
            <p className="text-zinc-500">Aucun match à venir renseigné.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.map((m) => <MatchCard key={m.id} match={m} variant="upcoming" />)}
            </div>
          )}
        </section>

        {/* Classements */}
        <section id="classements">
          <h2 className="text-2xl font-black mb-6">Classements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(standingGroups).map(([label, teams]) => (
              <StandingsGroup key={label} label={label} teams={teams} />
            ))}
          </div>
        </section>

        {/* Anniversaires */}
        <section id="anniversaires">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black">Anniversaires</h2>
            <span className="text-xs text-zinc-500">14 prochains jours</span>
          </div>
          {birthdays.length === 0 ? (
            <p className="text-zinc-500">Aucun anniversaire dans les 14 prochains jours.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {birthdays.map((p, i) => <BirthdayCard key={i} person={p} />)}
            </div>
          )}
        </section>

      </main>

      <footer className="border-t border-zinc-900 py-10 text-center text-zinc-700 text-sm">
        <p className="font-bold text-zinc-600 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} · Données FFHB &amp; Gesthand</p>
      </footer>

    </div>
  )
}
