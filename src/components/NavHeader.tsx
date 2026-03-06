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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-hbsme.png" alt="Logo HBSME" className="h-10 w-auto" />
          <div className="leading-tight">
            <p className="font-bold text-gray-800 text-sm">HBSME</p>
            <p className="text-xs text-gray-500">Saint-Médard d'Eyrans</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {navLinks.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              className={
                isActive(to, exact)
                  ? 'text-pink-600 font-semibold underline underline-offset-4 decoration-pink-400'
                  : 'text-gray-800 font-medium hover:text-pink-600 hover:underline hover:underline-offset-4 hover:decoration-pink-400 transition-colors'
              }
            >
              {label}
            </Link>
          ))}

          {/* Séparateur */}
          <span className="h-5 w-px bg-gray-300" aria-hidden />

          {/* Réseaux sociaux */}
          <a
            href="https://www.facebook.com/handbsme"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook HBSME"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            {/* Facebook icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/hbsme_officiel"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram HBSME"
            className="text-gray-600 hover:text-pink-600 transition-colors"
          >
            {/* Instagram icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>

          {/* Séparateur */}
          <span className="h-5 w-px bg-gray-300" aria-hidden />

          <Link
            to="/inscription"
            className="bg-pink-700 text-white px-3 py-1.5 rounded-lg hover:bg-pink-800 transition-colors font-semibold text-sm"
          >
            Inscription
          </Link>
        </nav>

        {/* Mobile burger */}
        <button className="md:hidden p-2 text-gray-600 hover:text-pink-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
