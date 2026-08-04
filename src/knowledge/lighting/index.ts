// ============================================================
// MUSEION — Base de connaissances Lumière
// Recettes locales et extensibles. Aucune requête réseau.
// ============================================================

import type { LightingRecipe } from '@/lib/types-storyboard'

/**
 * Palette utilisée par le compositeur de prévisualisation locale.
 * Ce n'est pas une mesure colorimétrique, seulement un repère visuel.
 */
export interface LightingPalette {
  sky: [string, string]
  ground: [string, string]
  key: string
  fill: string
  keyAngle: number // Position horizontale de la source, 0 → 1
  contrast: number // 0 = plat, 1 = très contrasté
}

export const LIGHTING_RECIPES: LightingRecipe[] = [
  {
    id: 'natural-side',
    name: 'Lumière naturelle latérale',
    description:
      'Source unique venant du côté, modelé fort sur le visage, ombre portée franche du côté opposé.',
    mood: 'Vérité, sobriété, présence physique',
    technicalNotes:
      'Fenêtre ou soleil à 90° du sujet. Négatif du côté ombre pour creuser. Pas de fill frontal.',
    tags: ['naturel', 'contrasté', 'jour', 'intérieur', 'extérieur'],
  },
  {
    id: 'golden-backlight',
    name: 'Contre-jour doré',
    description:
      'Soleil bas derrière le sujet, liseré chaud sur les contours, poussière rendue visible.',
    mood: 'Épopée, nostalgie, grandeur',
    technicalNotes:
      'Heure dorée courte : découper la journée. Réflecteur ou source de complément à −2 diaphs pour tenir le visage.',
    tags: ['doré', 'contre-jour', 'extérieur', 'magic hour'],
  },
  {
    id: 'diffuse',
    name: 'Lumière diffuse',
    description:
      'Grande source adoucie, ombres ouvertes, transitions longues. Aucun point chaud visible.',
    mood: 'Calme, neutralité, recueillement',
    technicalNotes:
      'Ciel couvert ou boîte à lumière large. Attention à la platitude : garder un dégradé de fond.',
    tags: ['doux', 'neutre', 'intérieur', 'jour'],
  },
  {
    id: 'packshot-premium',
    name: 'Packshot premium',
    description:
      'Objet isolé sur fond dégradé, key contrôlée, liseré de séparation, reflet maîtrisé.',
    mood: 'Précision, valeur, désir',
    technicalNotes:
      'Table de prise de vue, drapeaux noirs pour dessiner les arêtes. Utile pour les inserts d’objets sacrés.',
    tags: ['objet', 'insert', 'studio', 'contrôlé'],
  },
  {
    id: 'chiaroscuro',
    name: 'Clair-obscur',
    description:
      'Une seule source dure, la majorité du cadre plongée dans le noir, visage sculpté par une arête de lumière.',
    mood: 'Gravité, secret, menace intérieure',
    technicalNotes:
      'Rapport key/fill supérieur à 8:1. Protéger le fond de toute fuite. Exposition à surveiller sur les hautes lumières.',
    tags: ['sombre', 'contrasté', 'intérieur', 'nuit'],
  },
  {
    id: 'night-ambient',
    name: 'Lumière nocturne',
    description:
      'Ambiance bleu froid, sources pratiques chaudes dans le cadre, ciel encore lisible.',
    mood: 'Solitude, veille, attente',
    technicalNotes:
      'Base lunaire froide à faible niveau, torches et braseros comme accents. Ne jamais sous-exposer sans base d’ambiance.',
    tags: ['nuit', 'froid', 'extérieur', 'pratiques'],
  },
  {
    id: 'window-interior',
    name: 'Intérieur fenêtre',
    description:
      'Lumière entrant par une ouverture unique, chute rapide vers le fond de la pièce.',
    mood: 'Intimité, suspension, mémoire',
    technicalNotes:
      'Placer le sujet dans la zone de chute. Le fond doit rester lisible à −3 diaphs environ.',
    tags: ['intérieur', 'naturel', 'jour', 'doux'],
  },
  {
    id: 'volumetric',
    name: 'Lumière volumétrique',
    description:
      'Faisceaux visibles traversant l’air chargé, colonnes de lumière séparant les plans.',
    mood: 'Sacré, révélation, mystère',
    technicalNotes:
      'Nécessite un atmosphérique maîtrisé et un contre-jour. Continuité difficile : mesurer la densité de fumée à chaque prise.',
    tags: ['contre-jour', 'atmosphère', 'sacré', 'intérieur'],
  },
]

export const LIGHTING_PALETTES: Record<string, LightingPalette> = {
  'natural-side': {
    sky: ['#8d8f92', '#4a4d55'],
    ground: ['#5a5c60', '#26282e'],
    key: '#d9d6cc',
    fill: '#3a3d45',
    keyAngle: 0.16,
    contrast: 0.72,
  },
  'golden-backlight': {
    sky: ['#c9a266', '#5c4630'],
    ground: ['#6b533a', '#241c16'],
    key: '#f0d296',
    fill: '#453425',
    keyAngle: 0.5,
    contrast: 0.85,
  },
  diffuse: {
    sky: ['#9a9da3', '#6a6d75'],
    ground: ['#6d7078', '#3a3d45'],
    key: '#cfd2d6',
    fill: '#5d606a',
    keyAngle: 0.5,
    contrast: 0.28,
  },
  'packshot-premium': {
    sky: ['#2c2f36', '#16181d'],
    ground: ['#3a3d45', '#1a1c22'],
    key: '#e6e2d6',
    fill: '#2a2d34',
    keyAngle: 0.72,
    contrast: 0.66,
  },
  chiaroscuro: {
    sky: ['#2a2723', '#0d0c0b'],
    ground: ['#241f1a', '#0a0908'],
    key: '#e8c98a',
    fill: '#1a1713',
    keyAngle: 0.24,
    contrast: 0.95,
  },
  'night-ambient': {
    sky: ['#2c3c55', '#0b1119'],
    ground: ['#1c2634', '#080b10'],
    key: '#8fb6e8',
    fill: '#141c28',
    keyAngle: 0.68,
    contrast: 0.78,
  },
  'window-interior': {
    sky: ['#7d8188', '#33363d'],
    ground: ['#4c4f56', '#1c1e24'],
    key: '#e2ddd0',
    fill: '#2e3138',
    keyAngle: 0.2,
    contrast: 0.6,
  },
  volumetric: {
    sky: ['#5f6a74', '#171c24'],
    ground: ['#3a424c', '#0e1116'],
    key: '#dfe6ef',
    fill: '#232a33',
    keyAngle: 0.44,
    contrast: 0.82,
  },
}

export const DEFAULT_LIGHTING_PALETTE: LightingPalette = LIGHTING_PALETTES.diffuse

export function getLightingRecipe(id: string): LightingRecipe | undefined {
  return LIGHTING_RECIPES.find((l) => l.id === id || l.name === id)
}

/**
 * Retrouve une palette depuis un identifiant, un nom exact,
 * ou une description libre saisie dans un plan ("Contre-jour, dorée").
 */
export function resolveLightingPalette(input: string | undefined): LightingPalette {
  if (!input) return DEFAULT_LIGHTING_PALETTE
  const direct = LIGHTING_PALETTES[input]
  if (direct) return direct

  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const byName = LIGHTING_RECIPES.find((recipe) => {
    const recipeName = recipe.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    return normalized.includes(recipeName) || recipeName.includes(normalized)
  })
  if (byName) return LIGHTING_PALETTES[byName.id] ?? DEFAULT_LIGHTING_PALETTE

  if (normalized.includes('contre-jour') || normalized.includes('dore')) {
    return LIGHTING_PALETTES['golden-backlight']
  }
  if (normalized.includes('nuit') || normalized.includes('nocturne')) {
    return LIGHTING_PALETTES['night-ambient']
  }
  if (normalized.includes('torche') || normalized.includes('obscur') || normalized.includes('braser')) {
    return LIGHTING_PALETTES.chiaroscuro
  }
  if (normalized.includes('fenetre')) return LIGHTING_PALETTES['window-interior']
  if (normalized.includes('volum') || normalized.includes('faisceau')) return LIGHTING_PALETTES.volumetric
  if (normalized.includes('lateral')) return LIGHTING_PALETTES['natural-side']
  if (normalized.includes('voile') || normalized.includes('diffus')) return LIGHTING_PALETTES.diffuse

  return DEFAULT_LIGHTING_PALETTE
}
