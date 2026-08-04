// ============================================================
// MUSEION — Compositeur SVG local et déterministe
// Aucune IA, aucun réseau. Le rendu est une esquisse de cadrage,
// pas une image de production.
// ============================================================

import type { ShotType } from '@/lib/types-storyboard'
import { resolveLightingPalette, type LightingPalette } from '@/knowledge/lighting'

export interface MockSceneSpec {
  subject: string
  location: string
  intention: string
  shotType: ShotType
  lighting: string
  interior?: boolean
  seed?: string
}

// ---- Aléatoire déterministe ------------------------------------------------

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (value: number) => Math.round(value * 100) / 100

// ---- Classification du décor ----------------------------------------------

export type SceneryKind = 'city' | 'interior' | 'forest' | 'plain' | 'water' | 'mountain'

export function classifyScenery(spec: MockSceneSpec): SceneryKind {
  const text = `${spec.location} ${spec.subject}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (/deluge|euphrate|fleuve|eau|rive|barque|marais/.test(text)) return 'water'
  if (/montagne|mashu|pic|tunnel|col /.test(text)) return 'mountain'
  if (/foret|cedre|arbre|bois/.test(text)) return 'forest'
  if (spec.interior || /salle|palais|trone|interieur|chambre|temple int/.test(text)) return 'interior'
  if (/plaine|champ|canal|desert|steppe|troupeau/.test(text)) return 'plain'
  return 'city'
}

// ---- Échelle des personnages selon le type de plan -------------------------

interface FigurePlan {
  count: number
  scale: number // Fraction de la hauteur du cadre
  mode: 'body' | 'portrait' | 'fragment' | 'object' | 'texture' | 'pov'
}

const FIGURE_PLANS: Record<ShotType, FigurePlan> = {
  'extreme-wide': { count: 3, scale: 0.08, mode: 'body' },
  wide: { count: 2, scale: 0.34, mode: 'body' },
  medium: { count: 1, scale: 0.62, mode: 'body' },
  american: { count: 2, scale: 0.72, mode: 'body' },
  'medium-close': { count: 1, scale: 0.95, mode: 'body' },
  close: { count: 1, scale: 1, mode: 'portrait' },
  'extreme-close': { count: 1, scale: 1, mode: 'fragment' },
  insert: { count: 1, scale: 1, mode: 'object' },
  macro: { count: 1, scale: 1, mode: 'texture' },
  pov: { count: 1, scale: 1, mode: 'pov' },
}

// ---- Construction ----------------------------------------------------------

const W = 320
const H = 180

export function buildMockSvg(spec: MockSceneSpec): string {
  const seedSource =
    spec.seed ??
    `${spec.subject}|${spec.location}|${spec.intention}|${spec.shotType}|${spec.lighting}`
  const seed = hashString(seedSource)
  const rand = mulberry32(seed)
  const palette = resolveLightingPalette(spec.lighting)
  const scenery = classifyScenery(spec)
  const figures = FIGURE_PLANS[spec.shotType] ?? FIGURE_PLANS.wide
  const horizon = n(H * (0.52 + rand() * 0.12))
  const keyX = n(W * palette.keyAngle)
  const uid = seed.toString(36).slice(0, 6)

  const layers = [
    background(palette, horizon, uid),
    sceneryLayer(scenery, palette, horizon, rand, figures.mode),
    figuresLayer(figures, palette, horizon, rand),
    atmosphere(palette, keyX, horizon, uid),
    frameGuides(),
  ].join('')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`,
    defs(palette, keyX, horizon, uid),
    layers,
    '</svg>',
  ].join('')
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function buildMockPreviewDataUri(spec: MockSceneSpec): string {
  return svgToDataUri(buildMockSvg(spec))
}

// ---- Fragments -------------------------------------------------------------

function defs(palette: LightingPalette, keyX: number, horizon: number, uid: string): string {
  return `<defs>
<linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.sky[0]}"/>
<stop offset="100%" stop-color="${palette.sky[1]}"/>
</linearGradient>
<linearGradient id="gnd${uid}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.ground[0]}"/>
<stop offset="100%" stop-color="${palette.ground[1]}"/>
</linearGradient>
<radialGradient id="key${uid}" cx="${n(keyX / W)}" cy="${n(horizon / H - 0.12)}" r="0.62">
<stop offset="0%" stop-color="${palette.key}" stop-opacity="${n(0.42 + palette.contrast * 0.3)}"/>
<stop offset="100%" stop-color="${palette.key}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="vig${uid}" cx="0.5" cy="0.5" r="0.78">
<stop offset="55%" stop-color="#000" stop-opacity="0"/>
<stop offset="100%" stop-color="#000" stop-opacity="${n(0.28 + palette.contrast * 0.28)}"/>
</radialGradient>
<pattern id="hatch${uid}" width="6" height="6" patternTransform="rotate(38)" patternUnits="userSpaceOnUse">
<line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
</pattern>
</defs>`
}

function background(palette: LightingPalette, horizon: number, uid: string): string {
  return `<rect width="${W}" height="${H}" fill="url(#sky${uid})"/>
<rect y="${n(horizon)}" width="${W}" height="${n(H - horizon)}" fill="url(#gnd${uid})"/>
<rect width="${W}" height="${H}" fill="url(#key${uid})"/>`
}

function atmosphere(palette: LightingPalette, keyX: number, horizon: number, uid: string): string {
  const beams =
    palette.contrast > 0.75
      ? `<g opacity="0.18">
<polygon points="${n(keyX - 14)},0 ${n(keyX + 10)},0 ${n(keyX + 62)},${n(H)} ${n(keyX + 6)},${n(H)}" fill="${palette.key}"/>
<polygon points="${n(keyX + 24)},0 ${n(keyX + 34)},0 ${n(keyX + 96)},${n(H)} ${n(keyX + 62)},${n(H)}" fill="${palette.key}" opacity="0.6"/>
</g>`
      : ''
  return `${beams}
<rect width="${W}" height="${H}" fill="url(#hatch${uid})"/>
<rect width="${W}" height="${H}" fill="url(#vig${uid})"/>
<line x1="0" y1="${n(horizon)}" x2="${W}" y2="${n(horizon)}" stroke="#000" stroke-opacity="0.22" stroke-width="0.6"/>`
}

function frameGuides(): string {
  return `<g stroke="#ffffff" stroke-opacity="0.07" stroke-width="0.5">
<line x1="${n(W / 3)}" y1="0" x2="${n(W / 3)}" y2="${H}"/>
<line x1="${n((W * 2) / 3)}" y1="0" x2="${n((W * 2) / 3)}" y2="${H}"/>
<line x1="0" y1="${n(H / 3)}" x2="${W}" y2="${n(H / 3)}"/>
<line x1="0" y1="${n((H * 2) / 3)}" x2="${W}" y2="${n((H * 2) / 3)}"/>
</g>`
}

function sceneryLayer(
  kind: SceneryKind,
  palette: LightingPalette,
  horizon: number,
  rand: () => number,
  mode: FigurePlan['mode']
): string {
  if (mode === 'texture') return textureField(palette, rand)
  if (mode === 'fragment') return ''

  switch (kind) {
    case 'city':
      return citySkyline(palette, horizon, rand)
    case 'interior':
      return interiorHall(palette, horizon, rand)
    case 'forest':
      return cedarForest(palette, horizon, rand)
    case 'plain':
      return plainFields(palette, horizon, rand)
    case 'water':
      return floodWater(palette, horizon, rand)
    case 'mountain':
      return mountainRidge(palette, horizon, rand)
  }
}

function silhouette(opacity: number): string {
  return `fill="#05070a" fill-opacity="${n(opacity)}"`
}

function citySkyline(palette: LightingPalette, horizon: number, rand: () => number): string {
  const parts: string[] = []
  // Ziggurat centrale
  const zx = n(W * (0.32 + rand() * 0.3))
  const zw = n(52 + rand() * 26)
  const zh = n(30 + rand() * 22)
  parts.push(
    `<polygon points="${n(zx - zw / 2)},${n(horizon)} ${n(zx - zw / 2 + 8)},${n(horizon - zh * 0.42)} ${n(zx - zw / 2 + 16)},${n(horizon - zh * 0.72)} ${n(zx - zw / 4)},${n(horizon - zh)} ${n(zx + zw / 4)},${n(horizon - zh)} ${n(zx + zw / 2 - 16)},${n(horizon - zh * 0.72)} ${n(zx + zw / 2 - 8)},${n(horizon - zh * 0.42)} ${n(zx + zw / 2)},${n(horizon)}" ${silhouette(0.78)}/>`
  )
  // Tours de muraille
  for (let i = 0; i < 9; i++) {
    const x = n(i * (W / 9) + rand() * 6)
    const h = n(10 + rand() * 16)
    const w = n(W / 9 - 6)
    parts.push(`<rect x="${x}" y="${n(horizon - h)}" width="${w}" height="${n(h + 4)}" ${silhouette(0.62)}/>`)
  }
  parts.push(
    `<rect x="0" y="${n(horizon - 6)}" width="${W}" height="8" ${silhouette(0.7)}/>`
  )
  return `<g>${parts.join('')}</g>`
}

function interiorHall(palette: LightingPalette, horizon: number, rand: () => number): string {
  const parts: string[] = []
  parts.push(`<rect width="${W}" height="${n(horizon)}" fill="#0b0d11" fill-opacity="0.35"/>`)
  // Ouverture haute d'où vient la lumière
  const ox = n(W * palette.keyAngle)
  parts.push(
    `<rect x="${n(ox - 16)}" y="10" width="32" height="26" fill="${palette.key}" fill-opacity="${n(0.35 + palette.contrast * 0.4)}"/>`
  )
  // Colonnes
  const columns = 4
  for (let i = 0; i < columns; i++) {
    const x = n(18 + i * ((W - 36) / (columns - 1)))
    const w = n(13 + rand() * 5)
    parts.push(
      `<rect x="${n(x - w / 2)}" y="${n(14 + rand() * 8)}" width="${w}" height="${n(horizon + 26)}" ${silhouette(0.72)}/>`,
      `<rect x="${n(x - w / 2 - 3)}" y="${n(14 + rand() * 8)}" width="${n(w + 6)}" height="5" ${silhouette(0.8)}/>`
    )
  }
  // Estrade
  parts.push(
    `<rect x="${n(W * 0.3)}" y="${n(horizon + 8)}" width="${n(W * 0.4)}" height="6" ${silhouette(0.55)}/>`,
    `<rect x="${n(W * 0.34)}" y="${n(horizon + 2)}" width="${n(W * 0.32)}" height="6" ${silhouette(0.45)}/>`
  )
  return `<g>${parts.join('')}</g>`
}

function cedarForest(palette: LightingPalette, horizon: number, rand: () => number): string {
  const parts: string[] = []
  for (let i = 0; i < 11; i++) {
    const x = n(rand() * W)
    const w = n(6 + rand() * 12)
    const top = n(rand() * 26)
    parts.push(
      `<rect x="${n(x - w / 2)}" y="${top}" width="${w}" height="${n(horizon + 30 - top)}" ${silhouette(0.4 + rand() * 0.4)}/>`
    )
  }
  parts.push(`<rect width="${W}" height="${n(horizon * 0.42)}" fill="#05070a" fill-opacity="0.5"/>`)
  return `<g>${parts.join('')}</g>`
}

function plainFields(palette: LightingPalette, horizon: number, rand: () => number): string {
  const parts: string[] = []
  for (let i = 0; i < 4; i++) {
    const y = n(horizon + 6 + i * ((H - horizon) / 4))
    parts.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${n(y + (rand() - 0.5) * 6)}" stroke="#05070a" stroke-opacity="0.22" stroke-width="1"/>`
    )
  }
  const cityX = n(W * (0.6 + rand() * 0.25))
  parts.push(
    `<rect x="${n(cityX - 26)}" y="${n(horizon - 8)}" width="52" height="9" ${silhouette(0.45)}/>`,
    `<polygon points="${n(cityX - 8)},${n(horizon - 8)} ${n(cityX)},${n(horizon - 16)} ${n(cityX + 8)},${n(horizon - 8)}" ${silhouette(0.5)}/>`
  )
  return `<g>${parts.join('')}</g>`
}

function floodWater(palette: LightingPalette, horizon: number, rand: () => number): string {
  const parts: string[] = []
  for (let i = 0; i < 7; i++) {
    const y = n(horizon + 4 + i * ((H - horizon) / 7))
    const x = n(rand() * W * 0.5)
    const len = n(40 + rand() * 120)
    parts.push(
      `<line x1="${x}" y1="${y}" x2="${n(x + len)}" y2="${y}" stroke="${palette.key}" stroke-opacity="${n(0.08 + rand() * 0.16)}" stroke-width="1.2"/>`
    )
  }
  parts.push(
    `<path d="M0 ${n(horizon)} Q ${n(W * 0.25)} ${n(horizon - 8)} ${n(W * 0.5)} ${n(horizon)} T ${W} ${n(horizon)}" fill="none" stroke="#05070a" stroke-opacity="0.35" stroke-width="1.4"/>`
  )
  return `<g>${parts.join('')}</g>`
}

function mountainRidge(palette: LightingPalette, horizon: number, rand: () => number): string {
  const peak1 = n(W * 0.32)
  const peak2 = n(W * 0.68)
  const h1 = n(52 + rand() * 26)
  const h2 = n(46 + rand() * 26)
  return `<g>
<polygon points="0,${n(horizon)} ${n(peak1 - 60)},${n(horizon)} ${peak1},${n(horizon - h1)} ${n(peak1 + 60)},${n(horizon)}" ${silhouette(0.7)}/>
<polygon points="${n(peak2 - 66)},${n(horizon)} ${peak2},${n(horizon - h2)} ${n(peak2 + 70)},${n(horizon)} ${W},${n(horizon)}" ${silhouette(0.66)}/>
<rect x="${n((peak1 + peak2) / 2 - 12)}" y="${n(horizon - 26)}" width="24" height="30" rx="12" ${silhouette(0.85)}/>
</g>`
}

function textureField(palette: LightingPalette, rand: () => number): string {
  const parts: string[] = []
  for (let i = 0; i < 26; i++) {
    parts.push(
      `<circle cx="${n(rand() * W)}" cy="${n(rand() * H)}" r="${n(2 + rand() * 14)}" fill="${palette.key}" fill-opacity="${n(0.03 + rand() * 0.08)}"/>`
    )
  }
  return `<g>${parts.join('')}</g>`
}

function figuresLayer(
  plan: FigurePlan,
  palette: LightingPalette,
  horizon: number,
  rand: () => number
): string {
  switch (plan.mode) {
    case 'portrait':
      return portrait(palette)
    case 'fragment':
      return fragment(palette)
    case 'object':
      return objectInsert(palette)
    case 'texture':
      return ''
    case 'pov':
      return povFraming(palette, horizon)
    default:
      break
  }

  const baseY = n(Math.min(H - 6, horizon + (H - horizon) * 0.62))
  const parts: string[] = []
  for (let i = 0; i < plan.count; i++) {
    const height = n(H * plan.scale * (0.86 + rand() * 0.28))
    const x = n(W * (0.22 + i * (0.56 / Math.max(1, plan.count - 1 || 1)) + rand() * 0.08))
    parts.push(bodySilhouette(x, baseY, height))
  }
  return `<g>${parts.join('')}</g>`
}

function bodySilhouette(x: number, baseY: number, height: number): string {
  const headR = n(height * 0.11)
  const headY = n(baseY - height + headR)
  const shoulderY = n(headY + headR * 1.7)
  const halfW = n(height * 0.15)
  return `<g fill="#04060a" fill-opacity="0.86">
<circle cx="${x}" cy="${headY}" r="${headR}"/>
<path d="M${n(x - halfW)} ${n(baseY)} L${n(x - halfW * 0.7)} ${shoulderY} Q${x} ${n(shoulderY - headR * 0.6)} ${n(x + halfW * 0.7)} ${shoulderY} L${n(x + halfW)} ${n(baseY)} Z"/>
</g>`
}

function portrait(palette: LightingPalette): string {
  return `<g>
<ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.56)}" rx="${n(W * 0.19)}" ry="${n(H * 0.42)}" fill="#04060a" fill-opacity="0.88"/>
<ellipse cx="${n(W * 0.44)}" cy="${n(H * 0.5)}" rx="${n(W * 0.13)}" ry="${n(H * 0.36)}" fill="${palette.key}" fill-opacity="${n(0.12 + palette.contrast * 0.12)}"/>
<rect x="${n(W * 0.28)}" y="${n(H * 0.9)}" width="${n(W * 0.44)}" height="${n(H * 0.16)}" rx="6" fill="#04060a" fill-opacity="0.9"/>
</g>`
}

function fragment(palette: LightingPalette): string {
  return `<g>
<rect width="${W}" height="${H}" fill="#04060a" fill-opacity="0.55"/>
<ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.5)}" rx="${n(W * 0.3)}" ry="${n(H * 0.16)}" fill="${palette.key}" fill-opacity="0.2"/>
<ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.5)}" rx="${n(W * 0.09)}" ry="${n(H * 0.13)}" fill="#04060a" fill-opacity="0.92"/>
<circle cx="${n(W * 0.47)}" cy="${n(H * 0.46)}" r="4" fill="${palette.key}" fill-opacity="0.5"/>
</g>`
}

function objectInsert(palette: LightingPalette): string {
  return `<g>
<ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.78)}" rx="${n(W * 0.26)}" ry="8" fill="#04060a" fill-opacity="0.6"/>
<rect x="${n(W * 0.4)}" y="${n(H * 0.36)}" width="${n(W * 0.2)}" height="${n(H * 0.4)}" rx="4" fill="#04060a" fill-opacity="0.85"/>
<rect x="${n(W * 0.41)}" y="${n(H * 0.37)}" width="4" height="${n(H * 0.38)}" fill="${palette.key}" fill-opacity="0.35"/>
</g>`
}

function povFraming(palette: LightingPalette, horizon: number): string {
  return `<g fill="#04060a" fill-opacity="0.82">
<path d="M0 ${H} L0 ${n(horizon + 6)} Q${n(W * 0.12)} ${n(horizon + 30)} ${n(W * 0.2)} ${H} Z"/>
<path d="M${W} ${H} L${W} ${n(horizon + 2)} Q${n(W * 0.88)} ${n(horizon + 26)} ${n(W * 0.8)} ${H} Z"/>
</g>`
}
