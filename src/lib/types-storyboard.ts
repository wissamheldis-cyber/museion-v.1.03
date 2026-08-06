// ============================================================
// MUSEION — Types Storyboard, Plans & Assets — Sprint 2
// ============================================================

// ---- Cycle de vie des assets ----

export type AssetStatus =
  | 'ephemeral'   // Simulation locale, expiration 14j
  | 'candidate'   // En cours de validation
  | 'approved'    // Validé par un humain
  | 'canonical'   // Référence principale du projet
  | 'archived'    // Archivé manuellement
  | 'deleted'     // Supprimé — ne peut jamais devenir approved

export interface AssetVersion {
  id: string
  url: string
  prompt: string
  createdAt: string
  status: AssetStatus
}

export interface AssetRelation {
  id: string
  assetId: string
  relatedAssetId: string
  type: 'reference' | 'variation' | 'derived'
}

/** Journal des décisions humaines sur le cycle de vie des assets. */
export interface AssetJournalEntry {
  id: string
  assetId: string
  assetName: string
  action: string
  from?: AssetStatus
  to?: AssetStatus
  decidedBy: string
  decidedAt: string
  note?: string
}

export interface Asset {
  id: string
  projectId: string
  name: string
  type: 'image' | 'video' | 'reference' | 'character' | 'decor'
  status: AssetStatus
  url: string                   // SVG/data URI pour le mock
  thumbnailUrl?: string
  prompt?: string
  simulatedModel?: string
  sceneId?: string
  sequenceId?: string
  createdAt: string
  expiresAt?: string            // 14 jours pour ephemeral
  approvedAt?: string
  approvedBy?: string
  metadata: Record<string, string>
  versions: AssetVersion[]
  relations: AssetRelation[]
}

// ---- Types de plans ----

export type ShotType =
  | 'extreme-wide'   // Plan très large
  | 'wide'           // Plan large
  | 'medium'         // Plan moyen
  | 'american'       // Plan américain
  | 'medium-close'   // Plan rapproché
  | 'close'          // Gros plan
  | 'extreme-close'  // Très gros plan
  | 'insert'         // Insert
  | 'macro'          // Macro
  | 'pov'            // POV

// ---- Mouvements de caméra ----

export type CameraMovement =
  | 'static'         // Fixe
  | 'pan'            // Panoramique
  | 'tilt'           // Tilt
  | 'dolly-in'       // Travelling avant
  | 'dolly-out'      // Travelling arrière
  | 'dolly-lateral'  // Travelling latéral
  | 'push-in'        // Push-in
  | 'pull-out'       // Pull-out
  | 'orbital'        // Orbitale
  | 'crane'          // Grue
  | 'handheld'       // Caméra portée
  | 'steadicam'      // Steadicam
  | 'dolly-zoom'     // Dolly zoom

// ---- Base de connaissances ----

export interface CameraKnowledgeEntry {
  id: string
  name: string
  manufacturer: string
  sensor: string
  resolution: string
  dynamicRange: string
  focalRange: string
  ratios: string[]
  uses: string[]
  limits: string[]
  notes: string
}

export interface LensKnowledgeEntry {
  id: string
  name: string
  type: 'prime' | 'zoom'
  focalLength: string
  aperture: string
  character: string
  uses: string[]
  notes: string
}

export interface LightingRecipe {
  id: string
  name: string
  description: string
  mood: string
  technicalNotes: string
  tags: string[]
}

export interface DecorReference {
  id: string
  name: string
  identity: string
  architecture: string
  materials: string
  palette: string
  era: string
  geography: string
  props: string
  lighting: string
  continuity: string
  references: string[]
}

export interface ContinuityRule {
  id: string
  projectId: string
  description: string
  affectedScenes: string[]
  severity: 'info' | 'warning' | 'critical'
}

// ---- Storyboard — Séquences ----

export interface Sequence {
  id: string
  projectId: string
  number: number
  title: string
  description: string
  color: string    // Couleur d'identification dans le canvas
  order: number
}

// ---- Storyboard — Scènes visuel ----

export type SceneMoment = 'Aube' | 'Jour' | 'Crépuscule' | 'Nuit'

export interface StoryboardScene {
  id: string
  sequenceId: string
  projectId: string
  number: number
  title: string
  location: string
  timeOfDay: 'INT' | 'EXT' | 'INT/EXT'
  moment: SceneMoment
  emotion: string
  intention: string
  description: string
  /** Identifiant de recette de lumière ou description libre */
  lighting: string
  duration: number     // Durée en secondes
  mainShotType?: ShotType
  assetId?: string     // Asset miniature généré
  order: number
  canvasPosition: { x: number; y: number }
  notes: string
}

// ---- Storyboard — Plans techniques ----

export interface Shot {
  id: string
  sceneId: string
  projectId: string
  number: number
  type: ShotType
  focal: string
  camera: string
  sensor: string
  ratio: string
  movement: CameraMovement
  angle: string         // Plongée, contre-plongée, niveau
  height: string        // Hauteur de caméra
  filter: string        // Filtration optique
  duration: number      // En secondes
  frameRate: number     // Images/seconde
  lighting: string
  decor: string
  continuity: string
  risks: string
  references: string[]
  notes: string
  assetId?: string
  order: number
  /** Validé explicitement par un humain */
  validated: boolean
}

// ---- Canvas dynamique ----

export interface StoryboardNode {
  id: string
  type: 'scene'
  sceneId: string
  position: { x: number; y: number }
}

export interface StoryboardEdge {
  id: string
  source: string     // sceneId
  target: string     // sceneId
  type: 'sequential' | 'alternative'
  label?: string
}

// ---- État storyboard global ----

export interface StoryboardState {
  projectId: string
  sequences: Sequence[]
  scenes: StoryboardScene[]
  shots: Shot[]
  edges: StoryboardEdge[]
  assets: Asset[]
  canvasViewport: { x: number; y: number; zoom: number }
  selectedSceneId: string | null
  selectedShotId: string | null
}

// ---- Prompt composé ----

export interface ComposedPrompt {
  imagePrompt: string
  videoPrompt: string
  parameters: Record<string, string>
  composedAt: string
}

// ---- Prévisualisation ----

export interface PreviewResult {
  id: string
  status: AssetStatus   // 'ephemeral' pour le mock comme pour une vraie génération non validée
  url: string           // SVG data URI pour le mock, URL du pont ComfyUI pour une vraie génération
  prompt: string
  simulatedModel: string
  generatedAt: string
  isSimulation: boolean
  disclaimer: string
}
