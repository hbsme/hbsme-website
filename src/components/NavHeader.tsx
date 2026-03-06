import { Link, useRouterState } from '@tanstack/react-router'

const navLinks = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/collectifs', label: 'Collectifs' },
  { to: '/entrainements', label: 'Entraînements' },
  { to: '/partenaires', label: 'Partenaires' },
  { to: '/conseil-administration', label: 'Le Club' },
] as const

export function NavHeader() {
  const { location } = useRouterState()
  const pathname = location.pathname

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-hbsme.png" alt="Logo HBSME" className="h-10 w-auto" />
          <div className="leading-tight">
            <p className="font-bold text-gray-800 text-sm">HBSME</p>
            <p className="text-xs text-gray-500">Saint-Médard d'Eyrans</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {navLinks.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              className={
                isActive(to, exact)
                  ? 'text-pink-600 font-semibold'
                  : 'hover:text-pink-600 transition-colors'
              }
            >
              {label}
            </Link>
          ))}
          <Link
            to="/inscription"
            className="bg-pink-700 text-white px-3 py-1.5 rounded-lg hover:bg-pink-800 transition-colors font-semibold text-sm"
          >
            Inscription
          </Link>
        </nav>
        {/* Mobile burger - simple pour l'instant */}
        <button className="md:hidden p-2 text-gray-600 hover:text-pink-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
