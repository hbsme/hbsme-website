import { createFileRoute, useRouter, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { getUsers, createUser, updateUser, type UserRow } from '@/server/users'

export const Route = createFileRoute('/intranet/users/$userId')({
  loader: async ({ params }) => {
    if (params.userId === 'new') return { user: null }
    const users = await getUsers()
    const user = users.find(u => String(u.id) === params.userId)
    if (!user) throw notFound()
    return { user }
  },
  component: UserEditOverlay,
})

const ALL_PERMISSIONS = [
  { key: 'studio', label: '🎨 Studio' },
  { key: 'admin_users', label: '👥 Admin users' },
]
const ALL_ROLES = ['admin', 'coach', 'viewer']

function UserEditOverlay() {
  const { userId } = Route.useParams()
  const { user } = Route.useLoaderData() as { user: UserRow | null }
  const router = useRouter()
  const isNew = userId === 'new'

  const [form, setForm] = useState({
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'coach',
    permissions: user?.permissions ?? [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    router.navigate({ to: '/intranet/users' })
  }

  function togglePerm(key: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = isNew
        ? await createUser({ data: form })
        : await updateUser({ data: { id: user!.id, ...form } })
      if (!res.ok) { setError(res.error ?? 'Erreur'); return }
      close()
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? 'Nouvel utilisateur' : `${user!.prenom} ${user!.nom}`}
          </h2>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
              <input
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                required
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Permissions</label>
            <div className="space-y-2">
              {ALL_PERMISSIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(key)}
                    onChange={() => togglePerm(key)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : isNew ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </>
  )
}
