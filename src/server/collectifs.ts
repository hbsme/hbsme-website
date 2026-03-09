import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/index'
import { collectif, collectifCoach, hbsmeUser } from '@/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { logAudit } from './audit'
import { getSession } from './auth'

export type CollectifWithCoaches = {
  id: number
  categorie: string
  nom: string
  saison: string
  coaches: {
    userId: number
    prenom: string
    nom: string
    photo: string | null
    role: string | null
    sortOrder: number | null
    principal: boolean
  }[]
}

// Tous les collectifs avec leurs coachs (intranet — sans filtre principal)
export const getCollectifsWithCoaches = createServerFn().handler(async (): Promise<CollectifWithCoaches[]> => {
  const rows = await db
    .select({
      id: collectif.id,
      categorie: collectif.categorie,
      nom: collectif.nom,
      saison: collectif.saison,
      userId: hbsmeUser.id,
      prenom: hbsmeUser.prenom,
      nomUser: hbsmeUser.nom,
      photo: hbsmeUser.photo,
      role: collectifCoach.role,
      sortOrder: collectifCoach.sortOrder,
      principal: collectifCoach.principal,
    })
    .from(collectif)
    .leftJoin(collectifCoach, eq(collectifCoach.collectifId, collectif.id))
    .leftJoin(hbsmeUser, eq(hbsmeUser.id, collectifCoach.userId))
    .where(eq(collectif.active, true))
    .orderBy(asc(collectif.sortOrder), asc(collectifCoach.sortOrder))

  const map = new Map<number, CollectifWithCoaches>()
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, { id: row.id, categorie: row.categorie, nom: row.nom, saison: row.saison, coaches: [] })
    }
    if (row.userId != null) {
      map.get(row.id)!.coaches.push({
        userId: row.userId,
        prenom: row.prenom,
        nom: row.nomUser,
        photo: row.photo ?? null,
        role: row.role ?? null,
        sortOrder: row.sortOrder ?? null,
        principal: row.principal ?? true,
      })
    }
  }
  return Array.from(map.values())
})

// Collectifs d'un user donné (pour panel user)
export const getCoachCollectifs = createServerFn()
  .inputValidator((d: unknown) => d as { userId: number })
  .handler(async (ctx): Promise<{ collectifId: number; nom: string; categorie: string; role: string | null; sortOrder: number | null; principal: boolean }[]> => {
    const rows = await db
      .select({
        collectifId: collectif.id,
        nom: collectif.nom,
        categorie: collectif.categorie,
        role: collectifCoach.role,
        sortOrder: collectifCoach.sortOrder,
        principal: collectifCoach.principal,
      })
      .from(collectifCoach)
      .innerJoin(collectif, eq(collectif.id, collectifCoach.collectifId))
      .where(eq(collectifCoach.userId, ctx.data.userId))
      .orderBy(asc(collectif.sortOrder))
    return rows.map(r => ({ ...r, principal: r.principal ?? true }))
  })

// Tous les collectifs (pour le sélecteur)
export const getAllCollectifs = createServerFn().handler(async () => {
  return await db
    .select({ id: collectif.id, nom: collectif.nom, categorie: collectif.categorie, saison: collectif.saison })
    .from(collectif)
    .where(eq(collectif.active, true))
    .orderBy(asc(collectif.sortOrder))
})

// Upsert coach ↔ collectif
export const setCoachCollectif = createServerFn()
  .inputValidator((d: unknown) => d as { userId: number; collectifId: number; role: string; principal: boolean; sortOrder: number })
  .handler(async (ctx): Promise<{ ok: boolean }> => {
    const { userId, collectifId, role, principal, sortOrder } = ctx.data
    const actor = await getSession()
    const [col] = await db.select({ nom: collectif.nom }).from(collectif).where(eq(collectif.id, collectifId)).limit(1)
    const [user] = await db.select({ prenom: hbsmeUser.prenom, nom: hbsmeUser.nom }).from(hbsmeUser).where(eq(hbsmeUser.id, userId)).limit(1)

    await db
      .insert(collectifCoach)
      .values({ collectifId, userId, role, principal, sortOrder })
      .onConflictDoUpdate({
        target: [collectifCoach.collectifId, collectifCoach.userId],
        set: { role, principal, sortOrder },
      })

    await logAudit({
      userId: actor?.id,
      userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
      action: 'COLLECTIF_COACH_SET',
      targetType: 'collectif',
      targetId: collectifId,
      targetLabel: col?.nom ?? `#${collectifId}`,
      detail: { userId, userLabel: user ? `${user.prenom} ${user.nom}` : `#${userId}`, role, principal, sortOrder },
    })
    return { ok: true }
  })

// Retirer un coach d'un collectif
export const removeCoachCollectif = createServerFn()
  .inputValidator((d: unknown) => d as { userId: number; collectifId: number })
  .handler(async (ctx): Promise<{ ok: boolean }> => {
    const { userId, collectifId } = ctx.data
    const actor = await getSession()
    const [col] = await db.select({ nom: collectif.nom }).from(collectif).where(eq(collectif.id, collectifId)).limit(1)
    const [user] = await db.select({ prenom: hbsmeUser.prenom, nom: hbsmeUser.nom }).from(hbsmeUser).where(eq(hbsmeUser.id, userId)).limit(1)

    await db
      .delete(collectifCoach)
      .where(and(eq(collectifCoach.collectifId, collectifId), eq(collectifCoach.userId, userId)))

    await logAudit({
      userId: actor?.id,
      userLabel: actor ? `${actor.prenom} ${actor.nom}` : undefined,
      action: 'COLLECTIF_COACH_REMOVE',
      targetType: 'collectif',
      targetId: collectifId,
      targetLabel: col?.nom ?? `#${collectifId}`,
      detail: { userId, userLabel: user ? `${user.prenom} ${user.nom}` : `#${userId}` },
    })
    return { ok: true }
  })
