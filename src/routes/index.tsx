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

function generateWeekendText(matches: WeekendMatches) {
  // TODO: Remplacer par un appel IA (ex: OpenAI/Anthropic) avec les matchs en contexte
  if (matches.length === 0) {
    return "Pas de matchs disputés ce week-end. Rendez-vous la semaine prochaine pour suivre nos équipes !"
  }
  const wins = matches.filter(m => matchResult(m.score1, m.score2, m.team1) === 'win').length
  const total = matches.length
  return `Ce week-end, ${total} rencontre${total > 1 ? 's' : ''} étai${total > 1 ? 'ent' : 't'} au programme pour nos équipes. ${wins > 0 ? `Avec ${wins} victoire${wins > 1 ? 's' : ''} au compteur, le bilan est encourageant.` : 'Malgré des résultats difficiles, nos joueurs ont montré de la combativité.'} Retrouvez le détail des scores dans la section Résultats ci-dessous. Allez Saint-Médard ! 🤾`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TeamLogo({ url, alt, size = 'md' }: { url: string | null; alt: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
  if (!url) {
    return (
      <div className={`${dim} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold shrink-0`}>
        {alt.substring(0, 2)}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      className={`${dim} rounded-full object-contain bg-white border border-gray-100 p-0.5 shrink-0`}
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
  const category = teamCategory(match.competition)

  const resultStyle = {
    win: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', score: 'text-emerald-600' },
    loss: { badge: 'bg-gray-50 text-gray-500 border-gray-200', score: 'text-gray-400' },
    draw: { badge: 'bg-amber-50 text-amber-700 border-amber-200', score: 'text-amber-600' },
  }

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow border border-gray-100 shadow-sm">
      {/* Header: catégorie + compétition + résultat */}
      <div className="flex items-center gap-2">
        {category && (
          <span className="text-sm font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-0.5 shrink-0">
            {category}
          </span>
        )}
        <span className="text-xs text-gray-400 truncate flex-1">{formatCompetition(match.competition)}</span>
        {result && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${resultStyle[result].badge}`}>
            {result === 'win' ? 'Victoire' : result === 'loss' ? 'Défaite' : 'Nul'}
          </span>
        )}
      </div>

      {/* Corps: logos + noms + score */}
      <div className="flex items-center gap-3">
        <TeamLogo url={clubLogo} alt={teamLabel(clubTeam)} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{teamLabel(clubTeam)}</p>
          <p className="text-xs text-gray-400">{home ? 'Domicile' : 'Extérieur'}</p>
        </div>

        {variant === 'result' && clubScore != null && oppScore != null ? (
          <div className="text-center shrink-0 px-2">
            <span className="text-2xl font-black tabular-nums">
              <span className={result ? resultStyle[result].score : 'text-gray-900'}>{clubScore}</span>
              <span className="text-gray-300 mx-1.5">–</span>
              <span className="text-gray-400">{oppScore}</span>
            </span>
          </div>
        ) : (
          <div className="text-center shrink-0 px-2">
            <span className="text-xs font-semibold text-gray-500">
              {match.date ? formatDate(match.date) : 'Date TBD'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-gray-600 truncate">{teamLabel(oppTeam)}</p>
        </div>
        <TeamLogo url={oppLogo} alt={teamLabel(oppTeam)} size="lg" />
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
                className={`border-b border-gray-50 last:border-0 ${isClub ? 'bg-rose-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-2.5 text-gray-400 text-xs">{t.score_place}</td>
                <td className={`px-4 py-2.5 font-semibold text-sm ${isClub ? 'text-rose-600' : 'text-gray-700'}`}>
                  {isClub ? 'HBSME' : teamLabel(t.team)}
                </td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_joue}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_gagne}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_nul}</td>
                <td className="text-center px-2 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{t.score_perdu}</td>
                <td className={`text-center px-4 py-2.5 font-bold text-sm ${isClub ? 'text-rose-600' : 'text-gray-800'}`}>{t.score_point}</td>
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

function BirthdayWeek({ birthdays }: { birthdays: BirthdayRow[] }) {
  const today = new Date()
  // Construire les 7 prochains jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {days.map((d, i) => {
        const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const people = byDay[key] || []
        const isToday = i === 0

        return (
          <div
            key={key}
            className={`flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 ${isToday ? 'bg-rose-50' : ''}`}
          >
            {/* Badge date */}
            <div className={`rounded-xl w-12 shrink-0 flex flex-col items-center py-1.5 ${isToday ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <span className="text-xs font-semibold leading-none">{DAYS_FR[d.getDay()]}</span>
              <span className="text-xs leading-none mt-0.5 opacity-70">{MONTHS_FR[d.getMonth()]}</span>
              <span className={`text-base font-black leading-tight ${isToday ? 'text-white' : 'text-gray-700'}`}>{d.getDate()}</span>
            </div>

            {/* Noms */}
            <div className="flex-1 min-w-0">
              {people.length === 0 ? (
                <span className="text-sm text-gray-300">—</span>
              ) : (
                <span className={`text-sm font-medium ${isToday ? 'text-rose-700' : 'text-gray-700'}`}>
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
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-10 backdrop-blur bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={CLUB_LOGO} alt="Logo HBSME" className="w-9 h-9 object-contain" />
            <div>
              <p className="font-black text-gray-900 leading-tight">HBSME</p>
              <p className="text-xs text-gray-400">Saint-Médard d'Eyrans</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#weekend" className="hover:text-rose-600 transition-colors">Actu</a>
            <a href="#resultats" className="hover:text-rose-600 transition-colors">Résultats</a>
            <a href="#matchs" className="hover:text-rose-600 transition-colors">Matchs</a>
            <a href="#classements" className="hover:text-rose-600 transition-colors">Classements</a>
            <a href="#anniversaires" className="hover:text-rose-600 transition-colors">Anniversaires</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-rose-500 text-sm font-bold tracking-widest uppercase mb-3">
              Handball Club · Gironde
            </p>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none text-gray-900">
              Handball<br />
              <span className="text-rose-500">Saint-Médard</span><br />
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

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">

        {/* Anniversaires */}
        <section id="anniversaires">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-gray-900">🎂 Anniversaires</h2>
            <span className="text-xs text-gray-400">cette semaine</span>
          </div>
          <BirthdayWeek birthdays={birthdays} />
        </section>

        {/* Actu du week-end */}
        <section id="weekend">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-gray-900">Actu du week-end</h2>
            <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 bg-white">
              ✦ Résumé automatique
            </span>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-600 leading-relaxed text-base">{weekendText}</p>
            {weekendMatches.length > 0 && (
              <p className="text-xs text-gray-300 mt-4">
                Basé sur {weekendMatches.length} match{weekendMatches.length > 1 ? 's' : ''} du week-end.
              </p>
            )}
          </div>
        </section>

        {/* Résultats récents */}
        <section id="resultats">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Derniers résultats</h2>
          {results.length === 0 ? (
            <p className="text-gray-400">Aucun résultat disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((m) => <MatchCard key={m.id} match={m} variant="result" />)}
            </div>
          )}
        </section>

        {/* Prochains matchs */}
        <section id="matchs">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Prochains matchs</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400">Aucun match à venir renseigné.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.map((m) => <MatchCard key={m.id} match={m} variant="upcoming" />)}
            </div>
          )}
        </section>

        {/* Classements */}
        <section id="classements">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Classements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(standingGroups).map(([label, teams]) => (
              <StandingsGroup key={label} label={label} teams={teams} />
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 bg-white py-10 text-center text-gray-300 text-sm">
        <p className="font-bold text-gray-400 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} · Données FFHB &amp; Gesthand</p>
      </footer>

    </div>
  )
}
