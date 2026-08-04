// ============================================================
// MUSEION — Cycle de vie des assets
// Règles pures, testables, indépendantes du store.
// ============================================================

import type { Asset, AssetStatus } from '@/lib/types-storyboard'

export const EPHEMERAL_TTL_DAYS = 14
export const MS_PER_DAY = 24 * 60 * 60 * 1000

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  ephemeral: 'Temporaire',
  candidate: 'Candidat',
  approved: 'Validé',
  canonical: 'Canonique',
  archived: 'Archivé',
  deleted: 'Supprimé',
}

/** Accord au féminin, pour « miniature », « esquisse », « image ». */
export const ASSET_STATUS_LABELS_FEMININE: Record<AssetStatus, string> = {
  ephemeral: 'temporaire',
  candidate: 'candidate',
  approved: 'validée',
  canonical: 'canonique',
  archived: 'archivée',
  deleted: 'supprimée',
}

/**
 * Transitions autorisées.
 * `deleted` est terminal : aucune sortie, jamais de retour vers `approved`.
 */
export const ALLOWED_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  ephemeral: ['candidate', 'approved', 'archived', 'deleted'],
  candidate: ['approved', 'archived', 'deleted'],
  approved: ['canonical', 'archived', 'deleted'],
  canonical: ['archived', 'deleted'],
  archived: ['candidate', 'approved', 'deleted'],
  deleted: [],
}

export interface TransitionOptions {
  /** true uniquement si l'utilisateur a explicitement cliqué. */
  humanAction?: boolean
}

export interface TransitionCheck {
  allowed: boolean
  reason?: string
}

export function checkTransition(
  from: AssetStatus,
  to: AssetStatus,
  options: TransitionOptions = {}
): TransitionCheck {
  if (from === to) {
    return { allowed: false, reason: 'Le statut est déjà celui demandé.' }
  }
  if (from === 'deleted') {
    return {
      allowed: false,
      reason: 'Un asset supprimé ne peut plus changer de statut, et jamais devenir validé.',
    }
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    return {
      allowed: false,
      reason: `Transition ${ASSET_STATUS_LABELS[from]} → ${ASSET_STATUS_LABELS[to]} non autorisée.`,
    }
  }
  if (to === 'canonical' && !options.humanAction) {
    return {
      allowed: false,
      reason: 'Le passage en canonique exige une action humaine explicite.',
    }
  }
  return { allowed: true }
}

export function canTransition(
  from: AssetStatus,
  to: AssetStatus,
  options: TransitionOptions = {}
): boolean {
  return checkTransition(from, to, options).allowed
}

// ---- Expiration ------------------------------------------------------------

export function computeExpiry(createdAt: string, ttlDays = EPHEMERAL_TTL_DAYS): string {
  return new Date(new Date(createdAt).getTime() + ttlDays * MS_PER_DAY).toISOString()
}

/**
 * Jours restants avant expiration. Négatif si l'échéance est dépassée.
 */
export function daysRemaining(asset: Asset, now: Date = new Date()): number {
  if (!asset.expiresAt) return Number.POSITIVE_INFINITY
  return Math.ceil((new Date(asset.expiresAt).getTime() - now.getTime()) / MS_PER_DAY)
}

export function isExpired(asset: Asset, now: Date = new Date()): boolean {
  if (asset.status !== 'ephemeral') return false
  if (!asset.expiresAt) return false
  return new Date(asset.expiresAt).getTime() <= now.getTime()
}

/** Un asset utilisé dans le storyboard ne doit jamais partir sans confirmation. */
export function isUsedInStoryboard(asset: Asset): boolean {
  return Boolean(asset.sceneId)
}

export interface ExpirySweepResult {
  expired: Asset[]
  usedRequiringConfirmation: Asset[]
}

/**
 * Repère les assets temporaires arrivés à échéance.
 * Ne supprime rien : la suppression reste une décision humaine.
 */
export function sweepExpired(assets: Asset[], now: Date = new Date()): ExpirySweepResult {
  const expired = assets.filter((asset) => isExpired(asset, now))
  return {
    expired: expired.filter((asset) => !isUsedInStoryboard(asset)),
    usedRequiringConfirmation: expired.filter(isUsedInStoryboard),
  }
}

export function isTemporary(asset: Asset): boolean {
  return asset.status === 'ephemeral'
}
