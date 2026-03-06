import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/charte')({
  component: ChartePage,
})

const CLUB_LOGO = '/logo-hbsme.png'

function Section({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-black text-gray-900 mt-10 mb-4 pb-2 border-b border-pink-100">
      {title}
    </h2>
  )
}

function SubSection({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold text-pink-700 uppercase tracking-wider mt-6 mb-3">
      {title}
    </h3>
  )
}

function Items({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-gray-600 text-sm leading-relaxed">
          <span className="text-pink-400 mt-0.5 shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChartePage() {
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
            <Link to="/conseil-administration" className="hover:text-pink-800 transition-colors">Le Club</Link>
            <Link to="/collectifs" className="hover:text-pink-600 transition-colors">Collectifs</Link>
            <Link to="/inscription" className="bg-pink-700 text-white px-3 py-1.5 rounded-lg hover:bg-pink-800 transition-colors font-semibold text-sm">Inscription</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-12 pb-20">
        {/* Intro */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Charte du club</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Lors de votre inscription, vous avez signé notre charte — un pacte qui lie tous les membres du club.
            Ce document rappelle les valeurs fondamentales que nous partageons : respect, esprit sportif et convivialité.
          </p>
          <div className="mt-4 w-16 h-1 bg-pink-600 rounded mx-auto" />
        </div>

        {/* Corps de la charte */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-sm text-gray-600 leading-relaxed space-y-4">
          <p>
            Vous avez choisi de participer, par votre inscription ou celle de votre enfant, aux activités
            du club <strong className="text-gray-800">Handball Saint-Médard d'Eyrans</strong>.
          </p>
          <p>
            Le club est en premier lieu une association, c'est-à-dire la réunion de personnes poursuivant un même
            objectif et s'unissant pour l'atteindre. L'adhésion est un acte volontaire qui implique un engagement
            à participer et à apporter son concours au fonctionnement et au développement de l'association.
            L'association est gérée par une équipe de bénévoles qui ne demande qu'à être renforcée.
          </p>
          <p className="font-semibold text-gray-700">Ne soyez pas que des consommateurs ! Soyez indulgents !</p>

          <p>Cette charte a pour objectifs de :</p>
          <Items items={[
            'Contribuer au développement et au rayonnement du club',
            "Permettre à chaque adhérent de trouver sa place et de s'épanouir au sein du club",
            "Mettre en avant et développer un esprit citoyen chez les adhérents",
          ]} />

          {/* 1. Le joueur */}
          <Section title="1. Le joueur" />

          <SubSection title="1.1 L'esprit sportif" />
          <Items items={[
            'Je respecte les règles du jeu.',
            "J'accepte toutes les décisions de l'arbitre sans jamais mettre en doute son intégrité.",
            "Je démontre un esprit d'équipe par une collaboration franche avec les coéquipiers et les entraîneurs.",
            "J'aide les coéquipiers qui présentent plus de difficultés.",
            "Je refuse de gagner par des moyens illégaux et par tricherie.",
            "J'accepte les erreurs de mes coéquipiers.",
          ]} />

          <SubSection title="1.2 Le respect" />
          <Items items={[
            "Je considère un adversaire sportif comme indispensable pour jouer et non comme un ennemi.",
            "J'agis en tout temps avec courtoisie envers les entraîneurs, les officiels, les coéquipiers, les adversaires et les spectateurs.",
            "J'utilise un langage précis sans injure.",
            "Je suis ponctuel(le) aux entraînements et matches.",
            "Je m'entraîne dans une tenue adaptée.",
            "Je préviens le responsable en cas d'absence ou de maladie.",
            "Je suis motivé(e) et participe activement et avec assiduité aux entraînements.",
            "Je poursuis mon engagement envers mes coéquipiers, mon entraîneur et mon équipe jusqu'au bout.",
            "Je respecte le matériel du club, les gardiens des gymnases et les équipements municipaux.",
          ]} />

          <SubSection title="1.3 La dignité" />
          <Items items={[
            "Je conserve en tout temps mon sang-froid et la maîtrise de mes gestes face aux autres participants.",
            "J'accepte la victoire avec modestie sans ridiculiser l'adversaire.",
            "J'accepte la défaite en étant satisfait(e) de l'effort accompli dans les limites de mes capacités.",
            "J'accepte la défaite en reconnaissant également le bon travail accompli par l'adversaire.",
          ]} />

          <SubSection title="1.4 Le plaisir" />
          <Items items={[
            "Je joue pour m'amuser.",
            "Je considère la victoire et la défaite comme une conséquence du plaisir de jouer.",
            "Je considère le dépassement personnel plus important que l'obtention d'une médaille ou d'un trophée.",
          ]} />

          <SubSection title="1.5 L'honneur" />
          <Items items={[
            "Je me représente d'abord en tant qu'être humain.",
            "Je suis loyal(e) dans le sport et dans la vie.",
            "Je représente aussi mon équipe, mon association sportive et ma ville.",
            "Je véhicule les valeurs de mon sport par chacun de mes comportements.",
            "Je suis l'ambassadeur des valeurs du handball.",
          ]} />

          {/* 2. Les parents */}
          <Section title="2. Les parents" />
          <p>
            Inscrire un enfant à une activité ne signifie pas se dégager de toute responsabilité.
            Les enfants ne dépendent des entraîneurs que pour la durée de leur séance.
            Assurez-vous de la présence de l'entraîneur à l'arrivée de l'enfant.
          </p>
          <p>
            Nous vous demandons de répondre favorablement aux convocations données par l'entraîneur de votre enfant.
            Prévenez l'entraîneur en cas d'absence à un match.
          </p>
          <p>
            Afin d'organiser au mieux les déplacements lors des matchs à l'extérieur, nous comptons sur votre
            participation pour accompagner les joueurs.
          </p>
          <p>
            Le lavage du jeu de maillots sera également assuré à tour de rôle par les familles.
          </p>
          <p>
            En cas de problème, n'hésitez pas à contacter l'entraîneur ou un membre du bureau.
          </p>

          {/* 3. L'entraîneur */}
          <Section title="3. L'entraîneur" />
          <Items items={[
            "Il permet aux joueurs de pratiquer le handball dans un esprit sportif, en respectant les équipiers, les adversaires, les arbitres et les responsables du club.",
            "Il donne à chaque joueur le calendrier des matchs et le listing des joueurs avec les numéros de téléphone.",
            "Il rencontre les parents, les met en relation et les réunit au minimum une fois en début de saison (présentation, calendriers, organisation des déplacements, lavage des maillots…).",
            "À tout moment, il encourage les joueurs à prendre des initiatives en arbitrage et en encadrement, et les sensibilise à l'importance du rôle de chacun dans la vie du club.",
          ]} />
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p className="font-bold text-gray-400 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} HBSME — Tous droits réservés</p>
      </footer>
    </div>
  )
}
