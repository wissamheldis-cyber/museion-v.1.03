// ============================================================
// MUSEION — Composition déterministe de prompts
// Aucun LLM. Le prompt est une projection des paramètres validés.
// ============================================================

import type {
  CameraMovement,
  ComposedPrompt,
  Shot,
  ShotType,
  StoryboardScene,
} from '@/lib/types-storyboard'
import { getShotType, getCameraMovement, SHOT_TYPE_LABELS, CAMERA_MOVEMENT_LABELS } from '@/knowledge/camera'
import { getLightingRecipe } from '@/knowledge/lighting'
import { resolveDecor } from '@/knowledge/decors'

export const PROMPT_NOTICE = 'Prompt composé à partir des paramètres validés.'

export const DEFAULT_VALIDATED_STYLE =
  'épopée mésopotamienne, texture minérale, grain argentique fin, aucune surcharge numérique'

export interface PromptComposerInput {
  subject: string
  shotType: ShotType
  framing: string
  focal: string
  camera?: string
  movement: CameraMovement
  angle: string
  lighting: string
  decor: string
  continuity: string
  style?: string
  duration?: number
  frameRate?: number
}

/**
 * Composition strictement déterministe : les mêmes paramètres
 * produisent toujours exactement le même texte.
 */
export function composePrompt(input: PromptComposerInput): ComposedPrompt {
  const shotEntry = getShotType(input.shotType)
  const movementEntry = getCameraMovement(input.movement)
  const lightingRecipe = getLightingRecipe(input.lighting)
  const decorEntry = resolveDecor(input.decor)
  const style = input.style?.trim() || DEFAULT_VALIDATED_STYLE

  const shotFragment = shotEntry?.promptFragment ?? SHOT_TYPE_LABELS[input.shotType]
  const lightingFragment = lightingRecipe
    ? `${lightingRecipe.name.toLowerCase()} — ${lightingRecipe.description.toLowerCase().replace(/\.$/, '')}`
    : input.lighting.toLowerCase()
  const decorFragment = decorEntry
    ? `${decorEntry.name}, ${decorEntry.architecture.toLowerCase().replace(/\.$/, '')}, matériaux : ${decorEntry.materials.toLowerCase()}, palette : ${decorEntry.palette.toLowerCase()}`
    : input.decor

  const imageSegments = [
    clean(input.subject),
    shotFragment,
    clean(input.framing),
    `focale ${clean(input.focal)}`,
    input.camera ? `caméra ${clean(input.camera)}` : null,
    clean(input.angle).toLowerCase(),
    lightingFragment,
    decorFragment,
    input.continuity ? `continuité : ${clean(input.continuity).toLowerCase()}` : null,
    style,
  ].filter(isPresent)

  const videoSegments = [
    ...imageSegments,
    movementEntry?.promptFragment ?? CAMERA_MOVEMENT_LABELS[input.movement].toLowerCase(),
    movementEntry ? `dispositif : ${movementEntry.rig.toLowerCase()}` : null,
    input.duration ? `durée ${formatDuration(input.duration)}` : null,
    input.frameRate ? `${input.frameRate} images par seconde` : null,
  ].filter(isPresent)

  const parameters: Record<string, string> = {
    Sujet: clean(input.subject),
    'Type de plan': SHOT_TYPE_LABELS[input.shotType],
    Cadrage: clean(input.framing),
    Focale: clean(input.focal),
    Mouvement: CAMERA_MOVEMENT_LABELS[input.movement],
    Angle: clean(input.angle),
    Lumière: lightingRecipe?.name ?? clean(input.lighting),
    Décor: decorEntry?.name ?? clean(input.decor),
    Continuité: clean(input.continuity),
    'Style validé': style,
  }
  if (input.camera) parameters['Caméra'] = clean(input.camera)
  if (input.duration) parameters['Durée'] = formatDuration(input.duration)
  if (input.frameRate) parameters['Cadence'] = `${input.frameRate} i/s`

  return {
    imagePrompt: imageSegments.join(', '),
    videoPrompt: videoSegments.join(', '),
    parameters,
    composedAt: new Date().toISOString(),
  }
}

/**
 * Compose depuis un plan technique et sa scène d'origine.
 */
export function composePromptFromShot(
  shot: Shot,
  scene?: StoryboardScene,
  style?: string
): ComposedPrompt {
  const subject = scene
    ? `${scene.title} — ${scene.intention}`
    : shot.notes || 'Sujet non renseigné'

  return composePrompt({
    subject,
    shotType: shot.type,
    framing: `${shot.ratio}, hauteur caméra ${shot.height}`,
    focal: shot.focal,
    camera: shot.camera,
    movement: shot.movement,
    angle: shot.angle,
    lighting: shot.lighting,
    decor: shot.decor,
    continuity: shot.continuity,
    style,
    duration: shot.duration,
    frameRate: shot.frameRate,
  })
}

/**
 * Compose depuis une scène de storyboard (avant qu'un plan existe).
 */
export function composePromptFromScene(scene: StoryboardScene, style?: string): ComposedPrompt {
  return composePrompt({
    subject: `${scene.title} — ${scene.intention}`,
    shotType: scene.mainShotType ?? 'wide',
    framing: `${scene.timeOfDay === 'INT' ? 'intérieur' : 'extérieur'}, ${scene.emotion.toLowerCase()}`,
    focal: '35 mm',
    movement: 'static',
    angle: 'Niveau du regard',
    lighting: scene.lighting,
    decor: scene.location,
    continuity: `${scene.timeOfDay} — ${scene.moment} — ${scene.location}`,
    style,
    duration: scene.duration,
  })
}

function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ')
}

function isPresent(value: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const secondsLabel = Number.isInteger(rest) ? String(rest).padStart(2, '0') : rest.toFixed(1)
  return `${String(minutes).padStart(2, '0')}:${secondsLabel}`
}
