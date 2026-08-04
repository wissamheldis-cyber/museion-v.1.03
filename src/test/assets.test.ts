import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useMuseionStore } from '@/store/museionStore'
import {
  ALLOWED_TRANSITIONS,
  EPHEMERAL_TTL_DAYS,
  MS_PER_DAY,
  canTransition,
  checkTransition,
  computeExpiry,
  daysRemaining,
  isExpired,
  sweepExpired,
  type TransitionCheck,
} from '@/lib/assetLifecycle'
import type { Asset } from '@/lib/types-storyboard'
import { mockPreviewProvider } from '@/providers/preview'

function store() {
  return useMuseionStore.getState()
}

function makeAsset(patch: Partial<Asset> = {}): Asset {
  const createdAt = new Date('2026-08-01T10:00:00.000Z').toISOString()
  return {
    id: 'asset-test',
    projectId: 'proj-gilgamesh',
    name: 'Asset de test',
    type: 'image',
    status: 'ephemeral',
    url: 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E',
    createdAt,
    expiresAt: computeExpiry(createdAt),
    metadata: {},
    versions: [],
    relations: [],
    ...patch,
  }
}

beforeEach(() => {
  act(() => {
    store().resetToDemo()
  })
})

describe('Cycle de vie — règles pures', () => {
  it('autorise ephemeral → approved', () => {
    expect(canTransition('ephemeral', 'approved')).toBe(true)
  })

  it('interdit définitivement deleted → approved', () => {
    const check = checkTransition('deleted', 'approved', { humanAction: true })
    expect(check.allowed).toBe(false)
    expect(check.reason).toMatch(/supprimé/i)
    expect(ALLOWED_TRANSITIONS.deleted).toHaveLength(0)
  })

  it('interdit toute sortie de l’état deleted', () => {
    for (const target of ['ephemeral', 'candidate', 'approved', 'canonical', 'archived'] as const) {
      expect(canTransition('deleted', target, { humanAction: true })).toBe(false)
    }
  })

  it('exige une action humaine explicite pour approved → canonical', () => {
    expect(canTransition('approved', 'canonical')).toBe(false)
    expect(canTransition('approved', 'canonical', { humanAction: true })).toBe(true)
  })

  it('n’autorise pas ephemeral → canonical directement', () => {
    expect(canTransition('ephemeral', 'canonical', { humanAction: true })).toBe(false)
  })
})

describe('Cycle de vie — expiration à 14 jours', () => {
  it('calcule une échéance à 14 jours', () => {
    const createdAt = '2026-08-01T00:00:00.000Z'
    const expiry = computeExpiry(createdAt)
    const delta = new Date(expiry).getTime() - new Date(createdAt).getTime()
    expect(delta / MS_PER_DAY).toBe(EPHEMERAL_TTL_DAYS)
  })

  it('compte les jours restants', () => {
    const createdAt = new Date('2026-08-01T00:00:00.000Z').toISOString()
    const asset = makeAsset({ createdAt, expiresAt: computeExpiry(createdAt) })
    expect(daysRemaining(asset, new Date('2026-08-05T00:00:00.000Z'))).toBe(10)
    expect(daysRemaining(asset, new Date('2026-08-14T00:00:00.000Z'))).toBe(1)
  })

  it('marque un asset expiré après la quatorzième journée', () => {
    const createdAt = new Date('2026-08-01T00:00:00.000Z').toISOString()
    const asset = makeAsset({ createdAt, expiresAt: computeExpiry(createdAt) })
    expect(isExpired(asset, new Date('2026-08-14T23:00:00.000Z'))).toBe(false)
    expect(isExpired(asset, new Date('2026-08-15T00:00:01.000Z'))).toBe(true)
  })

  it('n’expire jamais un asset validé', () => {
    const asset = makeAsset({ status: 'approved', expiresAt: undefined })
    expect(isExpired(asset, new Date('2030-01-01T00:00:00.000Z'))).toBe(false)
  })

  it('sépare les expirés libres des expirés utilisés dans le storyboard', () => {
    const createdAt = new Date('2026-08-01T00:00:00.000Z').toISOString()
    const free = makeAsset({ id: 'free', createdAt, expiresAt: computeExpiry(createdAt) })
    const used = makeAsset({
      id: 'used',
      createdAt,
      expiresAt: computeExpiry(createdAt),
      sceneId: 'sb-scene-18',
    })

    const result = sweepExpired([free, used], new Date('2026-09-01T00:00:00.000Z'))
    expect(result.expired.map((a) => a.id)).toEqual(['free'])
    expect(result.usedRequiringConfirmation.map((a) => a.id)).toEqual(['used'])
  })
})

describe('Cycle de vie — actions du store', () => {
  it('fait passer un asset temporaire en validé', () => {
    const temporary = store().assets.find((a) => a.status === 'ephemeral')!
    let result: TransitionCheck | undefined
    act(() => {
      result = store().setAssetStatus(temporary.id, 'approved')
    })
    expect(result).toEqual({ allowed: true })

    const updated = store().assets.find((a) => a.id === temporary.id)!
    expect(updated.status).toBe('approved')
    expect(updated.expiresAt).toBeUndefined()
    expect(updated.approvedBy).toBe('Administrateur')
  })

  it('refuse de revalider un asset supprimé', () => {
    const temporary = store().assets.find((a) => a.status === 'ephemeral')!

    act(() => {
      store().deleteAsset(temporary.id)
    })
    expect(store().assets.find((a) => a.id === temporary.id)?.status).toBe('deleted')

    let result: TransitionCheck | undefined
    act(() => {
      result = store().setAssetStatus(temporary.id, 'approved', { humanAction: true })
    })
    expect(result?.allowed).toBe(false)

    let restore: TransitionCheck | undefined
    act(() => {
      restore = store().restoreAndApproveAsset(temporary.id)
    })
    expect(restore?.allowed).toBe(false)
    expect(store().assets.find((a) => a.id === temporary.id)?.status).toBe('deleted')
  })

  it('restaure et valide : annule l’expiration, conserve les métadonnées, journalise', () => {
    const temporary = store().assets.find(
      (a) => a.status === 'ephemeral' && a.sceneId === 'sb-scene-18'
    )!
    const prompt = temporary.prompt
    const model = temporary.simulatedModel

    act(() => {
      store().restoreAndApproveAsset(temporary.id)
    })

    const restored = store().assets.find((a) => a.id === temporary.id)!
    expect(restored.status).toBe('approved')
    expect(restored.expiresAt).toBeUndefined()
    expect(restored.prompt).toBe(prompt)
    expect(restored.simulatedModel).toBe(model)
    expect(restored.sceneId).toBe('sb-scene-18')

    const entry = store().assetJournal[0]
    expect(entry.action).toBe('Restaurer et valider')
    expect(entry.from).toBe('ephemeral')
    expect(entry.to).toBe('approved')
    expect(entry.decidedBy).toBe('Administrateur')
  })

  it('exige une action humaine pour passer en canonique', () => {
    const approved = store().assets.find((a) => a.status === 'approved')!

    let refused: TransitionCheck | undefined
    act(() => {
      refused = store().setAssetStatus(approved.id, 'canonical')
    })
    expect(refused?.allowed).toBe(false)

    act(() => {
      store().promoteAssetToCanonical(approved.id)
    })
    expect(store().assets.find((a) => a.id === approved.id)?.status).toBe('canonical')
  })
})

describe('MockPreviewProvider', () => {
  it('produit un asset temporaire, local et déterministe', async () => {
    const request = {
      subject: 'Les murs d’Uruk',
      location: 'Ext. — Uruk, la muraille',
      intention: 'Établir Uruk',
      shotType: 'extreme-wide' as const,
      lighting: 'golden-backlight',
      projectId: 'proj-gilgamesh',
      seed: 'test-seed',
    }

    const first = await mockPreviewProvider.generate(request)
    const second = await mockPreviewProvider.generate(request)

    expect(first.status).toBe('ephemeral')
    expect(first.isSimulation).toBe(true)
    expect(first.disclaimer).toBe('Simulation locale — aucune IA appelée.')
    expect(first.url.startsWith('data:image/svg+xml')).toBe(true)
    expect(first.url).toBe(second.url)
  })

  it('enregistre la prévisualisation avec une échéance de 14 jours', async () => {
    const preview = await mockPreviewProvider.generate({
      subject: 'Test',
      location: 'Int. — Palais',
      intention: 'Test',
      shotType: 'medium',
      lighting: 'chiaroscuro',
      projectId: 'proj-gilgamesh',
    })

    act(() => {
      store().registerPreview(preview, {
        name: 'Prévisualisation de test',
        sceneId: 'sb-scene-02',
        projectId: 'proj-gilgamesh',
      })
    })

    const asset = store().assets.find((a) => a.id === preview.id)!
    expect(asset.status).toBe('ephemeral')
    expect(asset.simulatedModel).toBe('museion-mock-compositor-v1')
    const delta = new Date(asset.expiresAt!).getTime() - new Date(asset.createdAt).getTime()
    expect(delta / MS_PER_DAY).toBe(EPHEMERAL_TTL_DAYS)
  })
})
