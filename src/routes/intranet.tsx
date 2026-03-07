import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/intranet')({
  component: IntranetLayout,
})

function IntranetLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-700">
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Intranet</span>
          <div className="text-white font-bold text-lg mt-0.5">HBSME</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link
            to="/intranet/studio"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors [&.active]:bg-gray-700 [&.active]:text-white"
          >
            🎨 Studio
          </Link>
        </nav>
        <div className="px-4 py-3 border-t border-gray-700">
          <a href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Site public
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
