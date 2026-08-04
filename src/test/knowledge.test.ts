import { describe, it, expect } from 'vitest'
import {
  CAMERAS,
  CAMERA_ANGLES,
  CAMERA_HEIGHTS,
  CAMERA_MOVEMENTS,
  CAMERA_MOVEMENT_LABELS,
  FRAME_RATES,
  KNOWLEDGE_DISCLAIMER,
  LENSES,
  RATIOS,
  SHOT_TYPES,
  SHOT_TYPE_LABELS,
  getCamera,
  getCameraMovement,
  getLens,
  getShotType,
} from '@/knowledge/camera'
import { LIGHTING_RECIPES, getLightingRecipe, resolveLightingPalette } from '@/knowledge/lighting'
import { DECOR_REFERENCES, getDecor, resolveDecor } from '@/knowledge/decors'
import { composePrompt, composePromptFromShot, PROMPT_NOTICE } from '@/lib/promptComposer'
import { buildComfyUIContract, comfyUIPreviewProviderContract } from '@/providers/preview'
import { DEMO_SHOTS, DEMO_STORYBOARD_SCENES } from '@/lib/demo-storyboard'
import type { CameraMovement, ShotType } from '@/lib/types-storyboard'

describe('Base de connaissances caméra', () => {
  it('contient les dix types de plans demandés', () => {
    expect(SHOT_TYPES).toHaveLength(10)
    const expected: ShotType[] = [
      'extreme-wide',
      'wide',
      'medium',
      'american',
      'medium-close',
      'close',
      'extreme-close',
      'insert',
      'macro',
      'pov',
    ]
    expect(SHOT_TYPES.map((s) => s.id).sort()).toEqual([...expected].sort())
    expect(SHOT_TYPE_LABELS.american).toBe('Plan américain')
  })

  it('contient les treize mouvements de caméra demandés', () => {
    expect(CAMERA_MOVEMENTS).toHaveLength(13)
    const expected: CameraMovement[] = [
      'static',
      'pan',
      'tilt',
      'dolly-in',
      'dolly-out',
      'dolly-lateral',
      'push-in',
      'pull-out',
      'orbital',
      'crane',
      'handheld',
      'steadicam',
      'dolly-zoom',
    ]
    expect(CAMERA_MOVEMENTS.map((m) => m.id).sort()).toEqual([...expected].sort())
    expect(CAMERA_MOVEMENT_LABELS['dolly-in']).toBe('Travelling avant')
  })

  it('expose des fiches caméra avec usages, limites, focales, capteurs et ratios', () => {
    expect(CAMERAS.length).toBeGreaterThanOrEqual(5)
    for (const camera of CAMERAS) {
      expect(camera.sensor).not.toBe('')
      expect(camera.focalRange).not.toBe('')
      expect(camera.ratios.length).toBeGreaterThan(0)
      expect(camera.uses.length).toBeGreaterThan(0)
      expect(camera.limits.length).toBeGreaterThan(0)
    }
  })

  it('se lit par identifiant ou par nom', () => {
    expect(getCamera('cam-alexa-35')?.name).toBe('ARRI Alexa 35')
    expect(getCamera('ARRI Alexa 35')?.id).toBe('cam-alexa-35')
    expect(getLens('lens-cooke-s7i')?.type).toBe('prime')
    expect(getShotType('close')?.label).toBe('Gros plan')
    expect(getCameraMovement('dolly-zoom')?.label).toBe('Dolly zoom')
  })

  it('fournit optiques, ratios, cadences, angles et hauteurs', () => {
    expect(LENSES.length).toBeGreaterThanOrEqual(6)
    expect(RATIOS).toContain('2.39:1')
    expect(FRAME_RATES).toContain(24)
    expect(CAMERA_ANGLES.length).toBeGreaterThan(3)
    expect(CAMERA_HEIGHTS.length).toBeGreaterThan(3)
  })

  it('porte un avertissement sur la valeur des simulations', () => {
    expect(KNOWLEDGE_DISCLAIMER).toMatch(/ne prouve jamais/i)
  })

  it('chaque plan de démonstration référence une caméra connue', () => {
    for (const shot of DEMO_SHOTS) {
      expect(getCamera(shot.camera), `caméra inconnue : ${shot.camera}`).toBeDefined()
    }
  })
})

describe('Base de connaissances lumière', () => {
  it('contient les huit recettes demandées', () => {
    expect(LIGHTING_RECIPES).toHaveLength(8)
    const names = LIGHTING_RECIPES.map((l) => l.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'Lumière naturelle latérale',
        'Contre-jour doré',
        'Lumière diffuse',
        'Packshot premium',
        'Clair-obscur',
        'Lumière nocturne',
        'Intérieur fenêtre',
        'Lumière volumétrique',
      ])
    )
  })

  it('résout une palette depuis un identifiant ou une description libre', () => {
    expect(getLightingRecipe('chiaroscuro')?.name).toBe('Clair-obscur')
    expect(resolveLightingPalette('golden-backlight')).toBe(
      resolveLightingPalette('Contre-jour doré')
    )
    expect(resolveLightingPalette('Contre-jour, dorée').keyAngle).toBeGreaterThan(0)
  })
})

describe('Base de connaissances décors', () => {
  it('décrit identité, architecture, matériaux, palette, époque et continuité', () => {
    expect(DECOR_REFERENCES.length).toBeGreaterThanOrEqual(6)
    for (const decor of DECOR_REFERENCES) {
      expect(decor.identity).not.toBe('')
      expect(decor.architecture).not.toBe('')
      expect(decor.materials).not.toBe('')
      expect(decor.palette).not.toBe('')
      expect(decor.era).not.toBe('')
      expect(decor.geography).not.toBe('')
      expect(decor.props).not.toBe('')
      expect(decor.lighting).not.toBe('')
      expect(decor.continuity).not.toBe('')
      expect(decor.references.length).toBeGreaterThan(0)
    }
  })

  it('retrouve un décor depuis un intitulé de plan', () => {
    expect(getDecor('decor-throne-room')?.name).toContain('Salle du trône')
    expect(resolveDecor('Int. — Palais d’Uruk, salle du trône')?.id).toBe('decor-throne-room')
  })
})

describe('Composition de prompts', () => {
  const input = {
    subject: 'Gilgamesh sur son trône',
    shotType: 'medium-close' as ShotType,
    framing: '2.39:1, hauteur caméra 1,60 m',
    focal: '85 mm',
    camera: 'ARRI Alexa 35',
    movement: 'push-in' as CameraMovement,
    angle: 'Niveau du regard',
    lighting: 'chiaroscuro',
    decor: 'Int. — Palais d’Uruk, salle du trône',
    continuity: 'Jour — 1er bloc',
    style: 'épopée mésopotamienne',
    duration: 3.4,
    frameRate: 24,
  }

  it('est déterministe pour les mêmes paramètres', () => {
    const a = composePrompt(input)
    const b = composePrompt(input)
    expect(a.imagePrompt).toBe(b.imagePrompt)
    expect(a.videoPrompt).toBe(b.videoPrompt)
  })

  it('produit une sortie image et une sortie vidéo distinctes', () => {
    const composed = composePrompt(input)
    expect(composed.imagePrompt).toContain('Gilgamesh sur son trône')
    expect(composed.imagePrompt).toContain('plan rapproché')
    expect(composed.imagePrompt).not.toContain('push-in')
    expect(composed.videoPrompt).toContain('push-in')
    expect(composed.videoPrompt).toContain('24 images par seconde')
    expect(composed.videoPrompt.length).toBeGreaterThan(composed.imagePrompt.length)
  })

  it('injecte les connaissances lumière et décor', () => {
    const composed = composePrompt(input)
    expect(composed.imagePrompt).toContain('clair-obscur')
    expect(composed.imagePrompt.toLowerCase()).toContain('salle du trône')
    expect(composed.parameters['Lumière']).toBe('Clair-obscur')
    expect(composed.parameters['Type de plan']).toBe('Plan rapproché')
  })

  it('compose depuis un plan technique et sa scène', () => {
    const shot = DEMO_SHOTS[0]
    const scene = DEMO_STORYBOARD_SCENES.find((s) => s.id === shot.sceneId)
    const composed = composePromptFromShot(shot, scene)
    expect(composed.imagePrompt).toContain(scene!.title)
    expect(composed.parameters['Focale']).toBe(shot.focal)
    expect(composed.parameters['Caméra']).toBe(shot.camera)
  })

  it('annonce que le prompt vient des paramètres validés', () => {
    expect(PROMPT_NOTICE).toBe('Prompt composé à partir des paramètres validés.')
  })
})

describe('Contrat ComfyUI', () => {
  it('construit une charge utile JSON sans effectuer d’appel', () => {
    const contract = buildComfyUIContract(
      {
        subject: 'Test',
        location: 'Ext. — Uruk',
        intention: 'Test',
        shotType: 'wide',
        lighting: 'diffuse',
        projectId: 'proj-gilgamesh',
        shotId: 'shot-001',
      },
      'prompt image'
    )
    expect(contract.contractVersion).toBe('1.0')
    expect(contract.inputs.positivePrompt).toBe('prompt image')
    expect(contract.metadata.shotId).toBe('shot-001')
    expect(contract.metadata.composedFrom).toBe('museion-prompt-composer')
  })

  it('reste inactif et refuse toute génération', async () => {
    expect(comfyUIPreviewProviderContract.isActive).toBe(false)
    await expect(
      comfyUIPreviewProviderContract.generate({
        subject: 'x',
        location: 'x',
        intention: 'x',
        shotType: 'wide',
        lighting: 'diffuse',
        projectId: 'proj-gilgamesh',
      })
    ).rejects.toThrow(/inactif/i)
  })
})
