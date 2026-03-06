import { createFileRoute, Link } from '@tanstack/react-router'
import { getPartenaires } from '../server/queries'

export const Route = createFileRoute('/partenaires')({
  head: () => ({
    meta: [
      { title: 'Nos partenaires — HBSME' },
      { name: 'description', content: `Les partenaires et sponsors du Handball Saint-Médard d'Eyrans. Rejoignez l'aventure et soutenez le club.` },
      { property: 'og:title', content: 'Nos partenaires — HBSME' },
      { property: 'og:description', content: `Les partenaires et sponsors du Handball Saint-Médard d'Eyrans. Rejoignez l'aventure et soutenez le club.` },
      { property: 'og:url', content: 'https://handball-saint-medard-deyrans.fr/partenaires' },
      { property: 'og:image', content: 'https://handball-saint-medard-deyrans.fr/logo-hbsme.png' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Nos partenaires — HBSME' },
      { name: 'twitter:description', content: `Les partenaires et sponsors du Handball Saint-Médard d'Eyrans.` },
    ],
    links: [{ rel: 'canonical', href: 'https://handball-saint-medard-deyrans.fr/partenaires' }],
  }),
  component: PartenairesPage,
  loader: async () => {
    const partenaires = await getPartenaires()
    return { partenaires }
  },
})

const CLUB_LOGO = '/logo-hbsme.png'

function PartenairesPage() {
  const { partenaires } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-4 pt-12 pb-20">
        {/* Intro */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Nos Partenaires</h1>
          <p className="text-gray-600 mt-3 max-w-2xl">Nos partenaires sont bien plus qu'un apport financier — ils sont comme des joueurs, essentiels au bon développement du club. Le HBSME les remercie chaleureusement et vous invite à les soutenir à votre tour.</p>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Bien plus qu'un soutien financier, nos partenaires font partie intégrante du club.
            L'équipe du HBSME les remercie chaleureusement et vous invite à les soutenir.
          </p>
          <div className="mt-4 w-16 h-1 bg-pink-600 rounded mx-auto" />
        </div>

        {/* Grille de logos */}
        {partenaires.length === 0 ? (
          <p className="text-center text-gray-400 py-20">Aucun partenaire à afficher pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {partenaires.map((p) => {
              const card = (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-pink-100 transition-all group aspect-square"
                >
                  <img
                    src={`/partenaires/${p.logo}`}
                    alt={p.name}
                    className="max-h-20 max-w-full object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3'
                    }}
                  />
                  <p className="text-xs text-center text-gray-500 font-medium leading-tight">{p.name}</p>
                </div>
              )

              return p.url ? (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                  {card}
                </a>
              ) : (
                <div key={p.id}>{card}</div>
              )
            })}
          </div>
        )}

        {/* CTA rejoindre */}
        <div className="mt-20 text-center bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl p-10 border border-pink-100">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Rejoignez l'aventure !</h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-6">
            Vous souhaitez soutenir le Handball Saint-Médard d'Eyrans et faire connaître votre activité ?
            Contactez-nous pour devenir partenaire du club.
          </p>
          <a
            href="mailto:contact@hbsme.fr"
            className="inline-block bg-pink-700 hover:bg-pink-800 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-sm"
          >
            Nous contacter
          </a>
        </div>
      </main>
    </div>
  )
}
