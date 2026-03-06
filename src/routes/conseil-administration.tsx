import { createFileRoute, Link } from '@tanstack/react-router'
import { getMembresCa } from '../server/queries'

export const Route = createFileRoute('/conseil-administration')({
  head: () => ({
    meta: [
      { title: "Conseil d'administration — HBSME" },
      { name: 'description', content: `Découvrez l'équipe dirigeante du HBSME : bureau et membres du conseil d'administration du club de handball.` },
      { property: 'og:title', content: "Conseil d'administration — HBSME" },
      { property: 'og:description', content: `Découvrez l'équipe dirigeante du HBSME.` },
      { property: 'og:url', content: 'https://handball-saint-medard-deyrans.fr/conseil-administration' },
      { property: 'og:image', content: 'https://handball-saint-medard-deyrans.fr/logo-hbsme.png' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://handball-saint-medard-deyrans.fr/conseil-administration' }],
  }),
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

      <main className="max-w-6xl mx-auto px-4 pt-12 pb-20">
        {/* Intro */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Conseil d'Administration</h1>
          <p className="text-gray-500 mt-3 max-w-2xl">À la tête de notre club, une équipe passionnée et dévouée. Retrouvez ici la composition complète de notre conseil d'administration, qui œuvre au quotidien pour le développement du HBSME.</p>
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
