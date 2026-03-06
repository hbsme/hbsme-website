// src/lib/cache.ts — Cache in-memory avec TTL
// Zéro dépendance, adapté aux données peu volatiles d'un site de club.

const store = new Map<string, { data: unknown; ts: number }>()

export const TTL = {
  /** Scores, résultats, anniversaires, classements — changent max 1x/jour */
  LIVE: 60 * 60 * 1000,          // 1 heure
  /** Données de saison : collectifs, partenaires, CA — changent rarement */
  SEASON: 24 * 60 * 60 * 1000,   // 24 heures
  /** Galerie photos — quasi statique */
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 jours
} as const

/**
 * Exécute `fn` et met le résultat en cache pendant `ttlMs`.
 * Retourne la valeur cachée si elle est encore fraîche.
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = TTL.LIVE,
): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.data as T
  }
  const data = await fn()
  store.set(key, { data, ts: Date.now() })
  return data
}

/** Invalide une clé (utile pour l'intranet après une modif) */
export function invalidate(key: string) {
  store.delete(key)
}

/** Invalide toutes les clés qui commencent par un préfixe */
export function invalidatePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
