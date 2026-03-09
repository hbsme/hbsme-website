import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/index'
import { partenaire } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { logAudit } from './audit'
import { getSession } from './auth'

export type PartenaireRow = {
  id: number
  name: string
  url: string | null
  logo: string
  sortOrder: number | null
  active: boolean | null
}

export const getPartenairesAdmin = createServerFn().handler(async (): Promise<PartenaireRow[]> => {
  return await db.select().from(partenaire).orderBy(asc(partenaire.sortOrder), asc(partenaire.name))
})

export const createPartenaire = createServerFn()
  .inputValidator((d: unknown) => d as { name: string; url: string; logo: string; sortOrder: number; active: boolean })
  .handler(async (ctx): Promise<{ ok: boolean; error?: string }> => {
    const { name, url, logo, sortOrder, active } = ctx.data
    try {
      const actor = await getSession()
      const result = await db.insert(partenaire).values({ name, url: url || null, logo, sortOrder, active }).returning({ id: partenaire.id })
      await logAudit({
        userId: actor?.id,
        userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
        action: 'PARTENAIRE_CREATE',
        targetType: 'partenaire',
        targetId: result[0]?.id,
        targetLabel: name,
        detail: { url, logo, sortOrder, active },
      })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Erreur lors de la création.' }
    }
  })

export const updatePartenaire = createServerFn()
  .inputValidator((d: unknown) => d as { id: number; name: string; url: string; logo: string; sortOrder: number; active: boolean })
  .handler(async (ctx): Promise<{ ok: boolean; error?: string }> => {
    const { id, name, url, logo, sortOrder, active } = ctx.data
    try {
      const actor = await getSession()
      // Récupère l'état avant modification pour le diff
      const [before] = await db.select().from(partenaire).where(eq(partenaire.id, id)).limit(1)
      await db.update(partenaire).set({ name, url: url || null, logo, sortOrder, active }).where(eq(partenaire.id, id))
      await logAudit({
        userId: actor?.id,
        userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
        action: 'PARTENAIRE_UPDATE',
        targetType: 'partenaire',
        targetId: id,
        targetLabel: name,
        detail: {
          old: before ? { name: before.name, url: before.url, logo: before.logo, sortOrder: before.sortOrder, active: before.active } : null,
          new: { name, url, logo, sortOrder, active },
        },
      })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Erreur lors de la mise à jour.' }
    }
  })

export const togglePartenaire = createServerFn()
  .inputValidator((d: unknown) => d as { id: number; active: boolean })
  .handler(async (ctx): Promise<{ ok: boolean }> => {
    const { id, active } = ctx.data
    const actor = await getSession()
    const [row] = await db.select({ name: partenaire.name }).from(partenaire).where(eq(partenaire.id, id)).limit(1)
    await db.update(partenaire).set({ active }).where(eq(partenaire.id, id))
    await logAudit({
      userId: actor?.id,
      userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
      action: 'PARTENAIRE_TOGGLE',
      targetType: 'partenaire',
      targetId: id,
      targetLabel: row?.name ?? `#${id}`,
      detail: { active },
    })
    return { ok: true }
  })

export const uploadLogo = createServerFn()
  .inputValidator((d: unknown) => d as { filename: string; base64: string })
  .handler(async (ctx): Promise<{ ok: boolean; filename?: string; error?: string }> => {
    const { path: nodePath, promises: fs } = await import('node:path').then(async m => ({
      path: m,
      promises: (await import('node:fs/promises'))
    }))
    try {
      const actor = await getSession()
      const { filename, base64 } = ctx.data
      // Sanitize filename
      const ext = nodePath.default.extname(filename).toLowerCase()
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg']
      if (!allowed.includes(ext)) return { ok: false, error: 'Format non supporté (jpg, png, webp, svg).' }
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
      const dir = '/home/basile/hbsme-website/public/partenaires'
      const dest = nodePath.default.join(dir, safeName)
      const buffer = Buffer.from(base64, 'base64')
      await fs.writeFile(dest, buffer)
      await logAudit({
        userId: actor?.id,
        userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
        action: 'LOGO_UPLOAD',
        targetType: 'partenaire',
        targetLabel: safeName,
        detail: { filename: safeName, sizeBytes: buffer.length },
      })
      return { ok: true, filename: safeName }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })
