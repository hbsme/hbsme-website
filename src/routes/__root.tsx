import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { NavHeader } from '../components/NavHeader'
import { Link } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HBSME — Handball Saint-Médard d\'Eyrans' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Identité */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo-hbsme.png" alt="Logo HBSME" className="h-10 w-auto" />
              <div>
                <p className="font-bold text-gray-800 text-sm">HBSME</p>
                <p className="text-xs text-gray-500">Handball Saint-Médard d'Eyrans</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Club de handball de Saint-Médard d'Eyrans, en Gironde. Tous niveaux, de l'éveil au senior.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Navigation</p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                { to: '/collectifs', label: 'Nos collectifs' },
                { to: '/entrainements', label: 'Entraînements' },
                { to: '/galerie', label: 'Galerie photos' },
                { to: '/partenaires', label: 'Partenaires' },
                { to: '/conseil-administration', label: 'Conseil d\'administration' },
                { to: '/charte', label: 'Charte du club' },
                { to: '/inscription', label: 'Inscription' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-pink-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & réseaux */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Suivez-nous</p>
            <div className="flex gap-3 mb-4">
              <a href="https://www.facebook.com/handbsme" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                Facebook
              </a>
              <a href="https://www.instagram.com/hbsme_officiel" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Salle Jean-Marie Lesca<br />
              33160 Saint-Médard d'Eyrans
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Handball Saint-Médard d'Eyrans · Données FFHB &amp; Gesthand
        </div>
      </div>
    </footer>
  )
}

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
