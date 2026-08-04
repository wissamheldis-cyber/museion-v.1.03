// ============================================================
// MUSEION — Miniatures de scènes et de plans
// Les vignettes sont composées localement, sans réseau.
// ============================================================

import type { Asset, Shot, StoryboardScene } from '@/lib/types-storyboard'
import { buildMockPreviewDataUri } from '@/providers/preview/mockSvg'

export function sceneThumbUrl(scene: StoryboardScene, assets: Asset[]): string {
  const attached = scene.assetId
    ? assets.find((a) => a.id === scene.assetId && a.status !== 'deleted')
    : undefined
  if (attached) return attached.url

  return buildMockPreviewDataUri({
    subject: `${scene.title} — ${scene.description || scene.intention}`,
    location: scene.location,
    intention: scene.intention,
    shotType: scene.mainShotType ?? 'wide',
    lighting: scene.lighting,
    interior: scene.timeOfDay === 'INT',
    seed: scene.id,
  })
}

export function shotThumbUrl(shot: Shot, scene: StoryboardScene | undefined, assets: Asset[]): string {
  const attached = shot.assetId
    ? assets.find((a) => a.id === shot.assetId && a.status !== 'deleted')
    : undefined
  if (attached) return attached.url

  return buildMockPreviewDataUri({
    subject: scene ? `${scene.title} — ${shot.notes}` : shot.notes,
    location: shot.decor,
    intention: scene?.intention ?? shot.notes,
    shotType: shot.type,
    lighting: shot.lighting,
    interior: shot.decor.toLowerCase().startsWith('int'),
    seed: shot.id,
  })
}

export function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds - minutes * 60
  const secondsLabel = Number.isInteger(rest)
    ? String(rest).padStart(2, '0')
    : rest.toFixed(1).padStart(4, '0')
  return `${String(minutes).padStart(2, '0')}:${secondsLabel}`
}
