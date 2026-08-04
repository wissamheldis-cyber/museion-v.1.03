// ============================================================
// MUSEION — Types centraux V1
// ============================================================

export interface StudioProfile {
  id: string
  name: string
  displayName: string
  role: 'administrator'
  createdAt: string
}

// ---- Auth ----

export interface AuthSession {
  profileId: string
  displayName: string
  authenticatedAt: string
}

// ---- Statuts ----

export type ProjectStatus =
  | 'draft'
  | 'concept'
  | 'development'
  | 'pre-production'
  | 'production'
  | 'post-production'
  | 'archived'

export type ProjectFormat =
  | 'feature'        // Long métrage
  | 'short'          // Court métrage
  | 'documentary'    // Documentaire
  | 'series'         // Série
  | 'animation'      // Animation

export type ProjectGenre =
  | 'historical'     // Historique
  | 'epic'           // Épique
  | 'drama'          // Drame
  | 'thriller'       // Thriller
  | 'documentary'    // Documentaire
  | 'fantasy'        // Fantastique
  | 'scifi'          // Science-fiction
  | 'comedy'         // Comédie

// ---- Traçabilité créative ----

export type TraceStatus = 'decision' | 'hypothesis' | 'open-question'

export interface Decision {
  id: string
  status: 'decision'
  content: string
  context?: string
  date: string
}

export interface Hypothesis {
  id: string
  status: 'hypothesis'
  content: string
  toValidate?: string
  date: string
}

export interface OpenQuestion {
  id: string
  status: 'open-question'
  content: string
  priority: 'low' | 'medium' | 'high'
  date: string
}

export type TraceItem = Decision | Hypothesis | OpenQuestion

// ---- Logline ----

export interface LoglineVersion {
  id: string
  content: string
  wordCount: number
  savedAt: string
  label?: string
}

// ---- Synopsis ----

export interface Synopsis {
  short: string
  long: string
  beginning: string
  development: string
  resolution: string
}

// ---- Traitement ----

export interface TreatmentAct {
  content: string
  keyMoments: string[]
}

export interface Treatment {
  actI: TreatmentAct
  actII: TreatmentAct
  actIII: TreatmentAct
  transformation: string
  emotionalResolution: string
}

// ---- Scénario ----

export type ScriptBlockType =
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'note'

export interface ScriptBlock {
  id: string
  type: ScriptBlockType
  content: string
  order: number
}

export interface ScriptScene {
  id: string
  number: number
  title: string
  location: string
  timeOfDay: 'INT' | 'EXT' | 'INT/EXT'
  blocks: ScriptBlock[]
  order: number
}

export interface Script {
  scenes: ScriptScene[]
  lastSavedAt?: string
}

// ---- Personnages ----

export interface CharacterRelation {
  characterId: string
  characterName: string
  relationshipType: string
  description: string
}

export interface Character {
  id: string
  name: string
  role: string
  actor?: string
  objective: string
  innerNeed: string
  contradiction: string
  arc: string
  relations: CharacterRelation[]
  appearance: string
  costume: string
  continuityNotes: string
  references: LocalAsset[]
  imageUrl?: string
}

// ---- Dossier artistique ----

export interface ArtisticDossier {
  intentionNote: string
  visualDirection: string
  colorPalette: string
  lighting: string
  sets: string
  costumes: string
  staging: string
  cinemaReferences: string
  sound: string
  music: string
  images: LocalAsset[]
}

// ---- Assets locaux ----

export interface LocalAsset {
  id: string
  name: string
  type: 'image' | 'document' | 'video' | 'audio'
  url: string
  thumbnailUrl?: string
  addedAt: string
}

// ---- Vision ----

export interface ProjectVision {
  promise: string
  intention: string
  theme: string
  world: string
  conflict: string
  arc: string
  tone: string
  audience: string
  duration: string
  references: LocalAsset[]
}

// ---- Canon validé ----

export interface ProjectCanon {
  logline: string
  synopsis?: Synopsis
}

// ---- Workflow de création ----

export type WorkflowStepId =
  | 'idea'
  | 'script'
  | 'bible'
  | 'characters'
  | 'storyboard'
  | 'previs'
  | 'plans'
  | 'production'
  | 'review'
  | 'delivery'

export type WorkflowStepStatus = 'todo' | 'in-progress' | 'done'

export interface WorkflowStep {
  id: WorkflowStepId
  label: string
  order: number
  status: WorkflowStepStatus
}

// ---- File de production ----

export interface RenderJob {
  id: string
  projectId: string
  sceneId?: string
  shotId?: string
  label: string
  kind: 'image' | 'video'
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled'
  createdAt: string
}

// ---- Démonstration guidée ----

export interface TourState {
  /** Identifiant de la visite en cours, null si aucune. */
  activeTourId: string | null
  /** Projet sur lequel la visite s'exécute — jamais un autre. */
  projectId: string | null
  stepIndex: number
  completedTourIds: string[]
  /** Visite explicitement ignorée par l'utilisateur. */
  skipped: boolean
}

// ---- Projet principal ----

export interface Project {
  id: string
  slug: string
  title: string
  status: ProjectStatus
  format: ProjectFormat
  genre: ProjectGenre
  logline: string
  loglineHistory: LoglineVersion[]
  vision?: ProjectVision
  synopsis?: Synopsis
  treatment?: Treatment
  script?: Script
  characters: Character[]
  artisticDossier?: ArtisticDossier
  canon?: ProjectCanon
  workflow: WorkflowStep[]
  traces: TraceItem[]
  isFavorite: boolean
  isArchived: boolean
  /** Projet de démonstration guidée, réinitialisable. */
  isDemo?: boolean
  demoVersion?: string
  coverImageUrl?: string
  completionPercent: number
  createdAt: string
  updatedAt: string
  lastSavedAt?: string
}

// ---- Store global ----

export interface MuseionStore {
  schemaVersion: number
  studioProfile: StudioProfile | null
  auth: AuthSession | null
  projects: Project[]
  lastSavedAt?: string
}
