import { createServerFn } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'OTP_REQUEST'
  | 'OTP_FAIL'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_ACTIVATE'
  | 'USER_DEACTIVATE'
  | 'PERMISSIONS_UPDATE'
  | 'ROLE_UPDATE'
  | 'PARTENAIRE_CREATE'
  | 'PARTENAIRE_UPDATE'
  | 'PARTENAIRE_TOGGLE'
  | 'LOGO_UPLOAD'
  | 'COLLECTIF_COACH_SET'
  | 'COLLECTIF_COACH_REMOVE'

export type LogAuditParams = {
  userId?: number | null
  userLabel?: string | null
  action: AuditAction
  targetType?: string
  targetId?: number
  targetLabel?: string
  detail?: Record<string, unknown>
  ip?: string
}

export async function logAudit(params: LogAuditParams) {
  try {
    const { db } = await import('@/db/index')
    const { hbsmeAudit } = await import('@/db/schema')
    await db.insert(hbsmeAudit).values({
      userId:      params.userId ?? null,
      userLabel:   params.userLabel ?? null,
      action:      params.action,
      targetType:  params.targetType ?? null,
      targetId:    params.targetId ?? null,
      targetLabel: params.targetLabel ?? null,
      detail:      params.detail ?? null,
      ip:          params.ip ?? null,
    })
  } catch {
    // Ne jamais crasher le flux principal à cause de l'audit
  }
}

// ── Server fn pour la page audit ──────────────────────────────────────────────

export type AuditRow = {
  id: number
  userId: number | null
  userLabel: string | null
  action: string
  targetType: string | null
  targetId: number | null
  targetLabel: string | null
  detail: unknown
  ip: string | null
  createdAt: Date
}

export const getAuditLog = createServerFn()
  .inputValidator((d: unknown) => d as { limit?: number; userId?: number; action?: string })
  .handler(async (ctx): Promise<AuditRow[]> => {
    const { db } = await import('@/db/index')
    const { hbsmeAudit } = await import('@/db/schema')
    const { limit = 300, userId, action } = ctx.data
    const rows = await db
      .select()
      .from(hbsmeAudit)
      .orderBy(desc(hbsmeAudit.createdAt))
      .limit(limit)
    return rows
      .filter(r => (!userId || r.userId === userId) && (!action || r.action === action))
      .map(r => ({
        ...r,
        userId: r.userId ?? null,
        userLabel: r.userLabel ?? null,
        targetType: r.targetType ?? null,
        targetId: r.targetId ?? null,
        targetLabel: r.targetLabel ?? null,
        ip: r.ip ?? null,
      }))
  })
