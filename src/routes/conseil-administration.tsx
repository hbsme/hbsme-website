import { createFileRoute, Link } from '@tanstack/react-router'
import { getMembresCa } from '../server/queries'

export const Route = createFileRoute('/conseil-administration')({
  component: ConseilAdministrationPage,
  loader: async () => {
    const membres = await getMembresCa()
    return { membres }
  },
})

const CLUB_LOGO = '/logo-hbsme.png'

const AVATAR_PLACEHOLDER = (nom: string) => {
  const initials = nom
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return initials
}

function MemberCard({ m, large = false }: { m: { id: number; nom: string; poste: string; photo: string | null }; large?: boolean }) {
  const size = large ? 'w-32 h-32' : 'w-24 h-24'
  const textSize = large ? 'text-base' : 'text-sm'

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className={`${size} rounded-full overflow-hidden border-2 border-pink-100 group-hover:border-pink-400 transition-colors shadow-sm bg-pink-50 flex items-center justify-center`}>
        {m.photo ? (
          <img
            src={`/ca/${m.photo}`}
            alt={m.nom}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              const parent = el.parentElement
              if (parent) {
                parent.innerHTML = `<span class="text-pink-400 font-black text-xl">${AVATAR_PLACEHOLDER(m.nom)}</span>`
              }
            }}
          />
        ) : (
          <span className="text-pink-400 font-black text-xl">{AVATAR_PLACEHOLDER(m.nom)}</span>
        )}
      </div>
      <div className="text-center">
        <p className={`font-bold text-gray-800 leading-tight ${textSize}`}>{m.nom}</p>
        <p className="text-xs text-pink-600 font-medium mt-0.5">{m.poste}</p>
      </div>
    </div>
  )
}

function ConseilAdministrationPage() {
  const { membres } = Route.useLoaderData()

  const top = membres.filter((m) => m.isTop)
  const others = membres.filter((m) => !m.isTop)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={CLUB_LOGO} alt="Logo HBSME" className="w-9 h-9 object-contain" />
            <div>
              <p className="font-black text-gray-900 leading-tight">HBSME</p>
              <p className="text-xs text-gray-400">Saint-Médard d'Eyrans</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6 ml-auto text-sm font-semibold text-gray-500">
            <Link to="/" className="hover:text-pink-800 transition-colors">Accueil</Link>
            <Link to="/partenaires" className="hover:text-pink-800 transition-colors">Partenaires</Link>
            <Link to="/conseil-administration" className="text-pink-700">Le Club</Link>
            <Link to="/inscription" className="bg-pink-700 text-white px-3 py-1.5 rounded-lg hover:bg-pink-800 transition-colors font-semibold text-sm">Inscription</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-12 pb-20">
        {/* Intro */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Conseil d'Administration</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            À la tête de notre club, une équipe passionnée et dévouée. Retrouvez ici la composition complète de notre conseil d'administration.
          </p>
          <div className="mt-4 w-16 h-1 bg-pink-600 rounded mx-auto" />
        </div>

        {membres.length === 0 ? (
          <p className="text-center text-gray-400 py-20">Aucun membre à afficher pour le moment.</p>
        ) : (
          <div className="space-y-14">
            {/* Bureau */}
            {top.length > 0 && (
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 text-center mb-8">Bureau</h2>
                <div className="flex flex-wrap justify-center gap-10">
                  {top.map((m) => (
                    <MemberCard key={m.id} m={m} large />
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            {top.length > 0 && others.length > 0 && (
              <div className="border-t border-gray-100" />
            )}

            {/* Administrateurs */}
            {others.length > 0 && (
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 text-center mb-8">Administrateurs</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8">
                  {others.map((m) => (
                    <MemberCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p className="font-bold text-gray-400 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} HBSME — Tous droits réservés</p>
      </footer>
    </div>
  )
}
