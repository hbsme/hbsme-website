import { createFileRoute } from '@tanstack/react-router'
import { getCollectifs } from '@/server/queries'

export const Route = createFileRoute('/_public/collectifs')({
  head: () => ({
    meta: [
      { title: 'Nos collectifs 2025/2026 — HBSME' },
      { name: 'description', content: `Découvrez toutes les équipes du HBSME, de l'U7 aux Seniors. Horaires, entraîneurs et informations pour chaque catégorie.` },
      { property: 'og:title', content: 'Nos collectifs 2025/2026 — HBSME' },
      { property: 'og:description', content: `Les équipes du HBSME de l'U7 aux Seniors.` },
      { property: 'og:url', content: 'https://handball-saint-medard-deyrans.fr/collectifs' },
      { property: 'og:image', content: 'https://handball-saint-medard-deyrans.fr/logo-hbsme.png' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://handball-saint-medard-deyrans.fr/collectifs' }],
  }),
  loader: () => getCollectifs(),
  component: CollectifsPage,
})


// "U11G" → "11G", "SG" / "SF" restent tels quels
function formatCategorie(cat: string): string {
  return cat.startsWith('U') ? cat.slice(1) : cat
}

// Couleurs par sexe
const colorBySexe = (categorie: string) => {
  if (categorie.endsWith('F')) return 'from-pink-500 to-rose-400'
  if (categorie === 'SF') return 'from-pink-500 to-rose-400'
  return 'from-blue-500 to-indigo-400'
}

const badgeBg = (categorie: string) => {
  if (categorie.endsWith('F') || categorie === 'SF')
    return 'bg-pink-100 text-pink-700'
  return 'bg-blue-100 text-blue-700'
}

function CollectifsPage() {
  const { collectifs, saison, isCurrent } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nos collectifs</h1>
          <p className="text-gray-500 mt-3 max-w-2xl">Découvrez toutes nos équipes de handball, de la plus jeune à la plus expérimentée ! Chaque collectif a ses entraîneurs passionnés prêts à accompagner chaque joueur dans sa progression. Que vous soyez débutant ou confirmé, vous trouverez votre place au sein du HBSME.</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-500">Saison {saison}</p>
            {!isCurrent && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Données de la dernière saison disponible
              </span>
            )}
          </div>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectifs.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Bandeau couleur / photo */}
              <div className={`relative h-36 bg-gradient-to-br ${colorBySexe(c.categorie)} flex items-center justify-center`}>
                {c.photo ? (
                  <img src={`/collectifs/${c.photo}`} alt={c.nom} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-5xl font-black opacity-30">{formatCategorie(c.categorie)}</span>
                )}
                <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeBg(c.categorie)}`}>
                  {formatCategorie(c.categorie)}
                </span>
              </div>

              {/* Contenu */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-1">{c.nom}</h2>
                {c.description && (
                  <p className="text-sm text-gray-500 mb-3">{c.description}</p>
                )}

                {/* Coachs */}
                {c.coachs.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Encadrement</p>
                    {c.coachs.map((coach, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {coach.photo ? (
                          <img
                            src={`/${coach.photo}`}
                            alt={`${coach.prenom} ${coach.nom}`}
                            className="w-8 h-8 rounded-full object-cover border-2 border-pink-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-200">
                            {coach.prenom?.[0] ?? ""}{coach.nom?.[0] ?? ""}
                          </div>
                        )}
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-gray-700">{coach.prenom} {coach.nom}</p>
                          {coach.role && <p className="text-xs text-gray-400">{coach.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-3 italic">Encadrement à renseigner</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
