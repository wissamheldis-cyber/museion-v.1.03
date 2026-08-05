import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Project,
  RenderJob,
  AuthSession,
  StudioProfile,
  LoglineVersion,
  ScriptScene,
  Character,
  ArtisticDossier,
  ProjectVision,
  Synopsis,
  Treatment,
  TourState,
  TraceItem,
} from '@/lib/types'
import type {
  Asset,
  AssetJournalEntry,
  AssetStatus,
  PreviewResult,
  Sequence,
  Shot,
  StoryboardEdge,
  StoryboardScene,
} from '@/lib/types-storyboard'
import type {
  WritingMission,
  WritingMessage,
  WritingVariant,
  ProductionJob,
  ReviewComment,
  ReviewChecklist,
  DeliverablePackage,
  AssetCollection,
  WritingTarget,
  WritingClassification
} from '@/lib/types-sprint4'
import { DEMO_PROJECTS } from '@/lib/demo-data'
import {
  DEMO_ASSETS,
  DEMO_SCENES_WITH_ASSETS,
  DEMO_SEQUENCES,
  DEMO_SHOTS,
  DEMO_STORYBOARD_EDGES,
  defaultCanvasPosition,
} from '@/lib/demo-storyboard'
import {
  checkTransition,
  computeExpiry,
  type TransitionCheck,
  type TransitionOptions,
} from '@/lib/assetLifecycle'
import { createWorkflow } from '@/lib/workflow'
import {
  bootstrapProject,
  uniqueSlug,
  validateNewProject,
  type FieldErrors,
  type NewProjectInput,
} from '@/lib/projectBootstrapper'
import { generateId } from '@/lib/utils'
import { resolveCurrentStudio } from '@/adapters/supabase/studios'
import { fetchWorkspace, bootstrapDemoData } from '@/adapters/supabase/workspace'
import * as projectsRemote from '@/adapters/supabase/projects'
import * as storyboardRemote from '@/adapters/supabase/storyboard'
import * as assetsRemote from '@/adapters/supabase/assets'
import * as sprint4Remote from '@/adapters/supabase/sprint4'

// ============================================================
// Schema versionné
// ============================================================

const SCHEMA_VERSION = 4

const DECIDED_BY = 'Administrateur'

// ============================================================
// State
// ============================================================

interface MuseionState {
  schemaVersion: number
  auth: AuthSession | null
  studioProfile: StudioProfile | null
  projects: Project[]
  lastSavedAt: string | null
  savedIndicator: boolean
  syncError: string | null

  // Auth
  setAuth: (session: AuthSession | null) => void
  setProfile: (profile: StudioProfile | null) => void
  signOut: () => void

  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  createProject: (
    input: NewProjectInput
  ) => Promise<
    { ok: true; project: Project } | { ok: false; errors: FieldErrors; message?: string }
  >
  duplicateProject: (projectId: string, title?: string) => Project | undefined
  resetDemoProject: () => void
  updateProject: (id: string, patch: Partial<Project>) => void
  toggleFavorite: (id: string) => void
  archiveProject: (id: string) => void
  getProject: (slug: string) => Project | undefined

  // Logline
  saveLoglineVersion: (projectId: string, content: string, label?: string) => void
  restoreLoglineVersion: (projectId: string, versionId: string) => void

  // Script
  updateScript: (projectId: string, scenes: ScriptScene[]) => void

  // Characters
  updateCharacter: (projectId: string, character: Character) => void
  addCharacter: (projectId: string, character: Omit<Character, 'id'>) => void
  removeCharacter: (projectId: string, characterId: string) => void

  // Artistic Dossier
  updateArtisticDossier: (projectId: string, patch: Partial<ArtisticDossier>) => void

  // Vision
  updateVision: (projectId: string, patch: Partial<ProjectVision>) => void

  // Synopsis
  updateSynopsis: (projectId: string, patch: Partial<Synopsis>) => void

  // Treatment
  updateTreatment: (projectId: string, patch: Partial<Treatment>) => void

  // Demo
  resetToDemo: () => void

  // Save indicator
  triggerSaveIndicator: () => void

  // Sync errors — a background write to Supabase failed after an optimistic
  // local update. Non-blocking: surfaces the failure instead of the previous
  // silent console.error, without altering the write itself.
  reportSyncError: (context: string, err: unknown) => void
  dismissSyncError: () => void

  // ---- Sprint 2 — Storyboard partagé ----
  sequences: Sequence[]
  scenes: StoryboardScene[]
  shots: Shot[]
  edges: StoryboardEdge[]
  assets: Asset[]
  assetJournal: AssetJournalEntry[]
  jobs: RenderJob[]
  canvasViewport: { x: number; y: number; zoom: number }
  selectedSceneId: string | null
  selectedShotId: string | null

  // ---- Démonstration guidée ----
  demoIntroDismissed: boolean
  tour: TourState
  dismissDemoIntro: () => void
  startTour: (tourId: string, projectId: string) => void
  goToTourStep: (index: number) => void
  nextTourStep: (total: number) => void
  prevTourStep: () => void
  skipTour: () => void
  exitTour: () => void
  completeTour: () => void
  replayTour: (tourId: string, projectId: string) => void

  // Séquences
  addSequence: (projectId: string, patch?: Partial<Sequence>) => Sequence
  updateSequence: (sequenceId: string, patch: Partial<Sequence>) => void
  removeSequence: (sequenceId: string) => void

  // Scènes
  addScene: (sequenceId: string, patch?: Partial<StoryboardScene>) => StoryboardScene
  updateScene: (sceneId: string, patch: Partial<StoryboardScene>) => void
  removeScene: (sceneId: string) => void
  duplicateScene: (sceneId: string) => StoryboardScene | undefined
  moveSceneToSequence: (sceneId: string, sequenceId: string) => void
  reorderScenes: (sequenceId: string, orderedSceneIds: string[]) => void
  selectScene: (sceneId: string | null) => void

  // Canvas
  setSceneCanvasPosition: (sceneId: string, position: { x: number; y: number }) => void
  setCanvasViewport: (viewport: { x: number; y: number; zoom: number }) => void
  resetCanvasLayout: () => void

  // Connexions
  addEdge: (source: string, target: string, type?: StoryboardEdge['type'], label?: string) => StoryboardEdge | undefined
  removeEdge: (edgeId: string) => void

  // Plans
  addShot: (sceneId: string, patch?: Partial<Shot>) => Shot
  updateShot: (shotId: string, patch: Partial<Shot>) => void
  removeShot: (shotId: string) => void
  duplicateShot: (shotId: string) => Shot | undefined
  setShotValidated: (shotId: string, validated: boolean) => void
  selectShot: (shotId: string | null) => void

  // Assets
  addAsset: (asset: Asset) => void
  registerPreview: (
    preview: PreviewResult,
    context: { name: string; sceneId?: string; shotId?: string; projectId: string; metadata?: Record<string, string> }
  ) => Asset
  setAssetStatus: (assetId: string, status: AssetStatus, options?: TransitionOptions) => TransitionCheck
  promoteAssetToCanonical: (assetId: string) => TransitionCheck
  deleteAsset: (assetId: string) => TransitionCheck
  restoreAndApproveAsset: (assetId: string) => TransitionCheck
  attachAssetToScene: (assetId: string, sceneId: string) => void
  attachAssetToShot: (assetId: string, shotId: string) => void
  detachAssetFromScene: (sceneId: string) => void

  // ---- Sprint 4 ----
  writingMissions: WritingMission[]
  writingMessages: WritingMessage[]
  writingVariants: WritingVariant[]
  productionJobs: ProductionJob[]
  reviewComments: ReviewComment[]
  reviewChecklists: ReviewChecklist[]
  deliverablePackages: DeliverablePackage[]
  assetCollections: AssetCollection[]
  traces: TraceItem[]

  addWritingMission: (projectId: string, title: string, target: WritingTarget, context: string) => WritingMission
  addWritingMessage: (missionId: string, role: 'user' | 'assistant', content: string, classification?: WritingClassification) => WritingMessage
  addWritingVariant: (missionId: string, label: string, content: string, target: WritingTarget) => WritingVariant
  selectWritingVariant: (variantId: string) => void
  removeWritingMission: (missionId: string) => void

  addProductionJob: (job: Omit<ProductionJob, 'id' | 'createdAt' | 'updatedAt'>) => ProductionJob
  updateProductionJob: (jobId: string, patch: Partial<ProductionJob>) => void
  startProductionJob: (jobId: string) => void
  completeProductionJob: (jobId: string, resultAssetId: string) => void
  approveProductionJob: (jobId: string) => void
  failProductionJob: (jobId: string, error: string) => void
  cancelProductionJob: (jobId: string) => void
  duplicateProductionJob: (jobId: string) => ProductionJob | undefined
  retryProductionJob: (jobId: string) => ProductionJob | undefined

  addReviewComment: (projectId: string, assetId: string, content: string) => ReviewComment
  removeReviewComment: (commentId: string) => void
  addReviewChecklist: (projectId: string, assetId: string, label: string) => ReviewChecklist
  toggleReviewChecklist: (checklistId: string) => void

  createDeliverablePackage: (projectId: string, title: string) => DeliverablePackage
  updateDeliverableSection: (packageId: string, sectionId: string, included: boolean) => void
  markDeliverableExported: (packageId: string) => void

  addAssetCollection: (projectId: string, name: string) => AssetCollection
  addAssetToCollection: (collectionId: string, assetId: string) => void
  removeAssetFromCollection: (collectionId: string, assetId: string) => void
  removeAssetCollection: (collectionId: string) => void

  // ---- V2 Initialization ----
  isV2Hydrated: boolean
  currentStudioId: string | null
  currentStudioRole: 'owner' | 'admin' | 'creator' | 'reviewer' | null
  hydrationError: string | null
  initV2: () => Promise<void>
}

// ============================================================
// Démonstration
// ============================================================

export const DEMO_PROJECT_ID = 'proj-gilgamesh'
export const DEMO_TOUR_ID = 'gilgamesh-v1'

const EMPTY_TOUR: TourState = {
  activeTourId: null,
  projectId: null,
  stepIndex: 0,
  completedTourIds: [],
  skipped: false,
}

/** Copie fraîche du projet de démonstration, jamais partagée par référence. */
function demoProjectSnapshot(): Project {
  const source = DEMO_PROJECTS.find((p) => p.id === DEMO_PROJECT_ID)
  if (!source) throw new Error('Projet de démonstration introuvable')
  return JSON.parse(JSON.stringify(source)) as Project
}

const DEMO_SCENE_IDS = new Set(DEMO_SCENES_WITH_ASSETS.map((s) => s.id))

function isDemoEdge(edge: StoryboardEdge): boolean {
  return DEMO_SCENE_IDS.has(edge.source) || DEMO_SCENE_IDS.has(edge.target)
}

// ============================================================
// Journal des décisions sur les assets
// ============================================================

type JournalSetter = (updater: (state: MuseionState) => Partial<MuseionState>) => void

function appendJournal(
  set: JournalSetter,
  entry: Omit<AssetJournalEntry, 'id' | 'decidedAt' | 'decidedBy'>
): AssetJournalEntry {
  const fullEntry: AssetJournalEntry = {
    ...entry,
    id: generateId(),
    decidedBy: DECIDED_BY,
    decidedAt: new Date().toISOString(),
  }
  set((state) => ({
    assetJournal: [fullEntry, ...state.assetJournal].slice(0, 200),
  }))
  return fullEntry
}

// ============================================================
// Store
// ============================================================

export const useMuseionStore = create<MuseionState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      auth: null,
      studioProfile: null,
      projects: DEMO_PROJECTS,
      lastSavedAt: null,
      savedIndicator: false,
      syncError: null,

      // ---- Auth ----

      setAuth: (session) => {
        set({ auth: session })
      },

      setProfile: (profile) => {
        set({ studioProfile: profile })
      },

      signOut: () => {
        set({
          auth: null, studioProfile: null, isV2Hydrated: false,
          currentStudioId: null, currentStudioRole: null, hydrationError: null,
        })
      },

      // ---- Projects ----

      addProject: (projectData) => {
        const now = new Date().toISOString()
        const project: Project = {
          ...projectData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          lastSavedAt: now,
        }
        set((state) => ({
          projects: [project, ...state.projects],
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.createProjectRemote(studioId, project).catch((err) => {
            console.error('Rollback addProject', err)
            get().reportSyncError('addProject', err)
            set((state) => ({ projects: state.projects.filter((p) => p.id !== project.id) }))
          })
        }
        get().triggerSaveIndicator()
        return project
      },

      createProject: async (input) => {
        const result = validateNewProject(input)
        if (!result.ok) return result

        const project = bootstrapProject(result.data, {
          existingSlugs: get().projects.map((p) => p.slug),
        })

        const studioId = get().currentStudioId

        if (process.env.NODE_ENV !== 'production') {
          console.log('[createProject] tentative', {
            authProfileId: get().auth?.profileId ?? null,
            currentStudioId: studioId,
            currentStudioRole: get().currentStudioRole,
            projectId: project.id,
            slug: project.slug,
          })
        }

        if (!studioId) {
          console.error(
            '[createProject] Aucun studio actif (currentStudioId est null) — le projet ne peut pas être créé.'
          )
          return {
            ok: false,
            errors: {},
            message:
              "Aucun studio actif pour ce compte. Le projet n'a pas été créé — vérifiez que ce compte appartient bien à un studio.",
          }
        }

        // Mise à jour optimiste locale, annulée si Supabase refuse l'insertion.
        set((state) => ({
          projects: [project, ...state.projects],
          lastSavedAt: project.createdAt,
        }))

        try {
          await projectsRemote.createProjectRemote(studioId, project)
        } catch (err) {
          console.error('[createProject] Échec de la création côté Supabase, annulation locale :', err)
          set((state) => ({ projects: state.projects.filter((p) => p.id !== project.id) }))
          return {
            ok: false,
            errors: {},
            message: 'La création du projet a échoué côté serveur. Rien n’a été enregistré — réessayez.',
          }
        }

        get().triggerSaveIndicator()
        return { ok: true, project }
      },

      duplicateProject: (projectId, title) => {
        const state = get()
        const source = state.projects.find((p) => p.id === projectId)
        if (!source) return undefined

        const now = new Date().toISOString()
        const newId = generateId()
        const nextTitle = title?.trim() || `${source.title} (copie)`
        const copy: Project = {
          ...source,
          id: newId,
          slug: uniqueSlug(nextTitle, state.projects.map((p) => p.slug)),
          title: nextTitle,
          // Une copie personnelle n'est jamais une démonstration.
          isDemo: false,
          demoVersion: undefined,
          isFavorite: false,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          lastSavedAt: now,
        }

        // Le storyboard est recopié en réattribuant tous les identifiants,
        // pour que rien ne soit partagé entre les deux projets.
        const sequenceMap = new Map<string, string>()
        const sceneMap = new Map<string, string>()
        const assetMap = new Map<string, string>()

        const sequences = state.sequences
          .filter((q) => q.projectId === projectId)
          .map((q) => {
            const id = generateId()
            sequenceMap.set(q.id, id)
            return { ...q, id, projectId: newId }
          })

        const assets: Asset[] = state.assets
          .filter((a) => a.projectId === projectId && a.status !== 'deleted')
          .map((a) => {
            const id = generateId()
            assetMap.set(a.id, id)
            return {
              ...a,
              id,
              projectId: newId,
              sceneId: undefined,
              versions: [],
              relations: [],
            }
          })

        const scenes: StoryboardScene[] = state.scenes
          .filter((sc) => sc.projectId === projectId)
          .map((sc) => {
            const id = generateId()
            sceneMap.set(sc.id, id)
            return {
              ...sc,
              id,
              projectId: newId,
              sequenceId: sequenceMap.get(sc.sequenceId) ?? sc.sequenceId,
              assetId: sc.assetId ? assetMap.get(sc.assetId) : undefined,
            }
          })

        for (const asset of assets) {
          const original = state.assets.find((a) => assetMap.get(a.id) === asset.id)
          if (original?.sceneId) asset.sceneId = sceneMap.get(original.sceneId)
        }

        const shots = state.shots
          .filter((sh) => sh.projectId === projectId)
          .map((sh) => ({
            ...sh,
            id: generateId(),
            projectId: newId,
            sceneId: sceneMap.get(sh.sceneId) ?? sh.sceneId,
            assetId: sh.assetId ? assetMap.get(sh.assetId) : undefined,
          }))

        const edges = state.edges
          .filter((e) => sceneMap.has(e.source) && sceneMap.has(e.target))
          .map((e) => ({
            ...e,
            id: generateId(),
            source: sceneMap.get(e.source)!,
            target: sceneMap.get(e.target)!,
          }))

        set((st) => ({
          projects: [copy, ...st.projects],
          sequences: [...st.sequences, ...sequences],
          scenes: [...st.scenes, ...scenes],
          shots: [...st.shots, ...shots],
          edges: [...st.edges, ...edges],
          assets: [...st.assets, ...assets],
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          ;(async () => {
            await projectsRemote.createProjectRemote(studioId, copy)
            for (const a of assets) await assetsRemote.createAssetRemote(studioId, a)
            for (const q of sequences) await storyboardRemote.createSequenceRemote(studioId, q)
            for (const sc of scenes) await storyboardRemote.createSceneRemote(studioId, sc)
            for (const sh of shots) await storyboardRemote.createShotRemote(studioId, sh)
            for (const e of edges) await storyboardRemote.createEdgeRemote(studioId, newId, e)
          })().catch((err) => {
            console.error('Rollback duplicateProject', err)
            get().reportSyncError('duplicateProject', err)
            projectsRemote.deleteProjectRemote(newId).catch(() => {})
            const newEdgeIds = new Set(edges.map((e) => e.id))
            set((st) => ({
              projects: st.projects.filter((p) => p.id !== newId),
              sequences: st.sequences.filter((q) => q.projectId !== newId),
              scenes: st.scenes.filter((sc) => sc.projectId !== newId),
              shots: st.shots.filter((sh) => sh.projectId !== newId),
              edges: st.edges.filter((e) => !newEdgeIds.has(e.id)),
              assets: st.assets.filter((a) => a.projectId !== newId),
            }))
          })
        }
        get().triggerSaveIndicator()
        return copy
      },

      resetDemoProject: () => {
        // Remet la démonstration dans son état canonique, sans jamais
        // toucher aux projets de l'utilisateur.
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === DEMO_PROJECT_ID ? demoProjectSnapshot() : p
          ),
          sequences: [
            ...state.sequences.filter((q) => q.projectId !== DEMO_PROJECT_ID),
            ...DEMO_SEQUENCES.filter((q) => q.projectId === DEMO_PROJECT_ID),
          ],
          scenes: [
            ...state.scenes.filter((sc) => sc.projectId !== DEMO_PROJECT_ID),
            ...DEMO_SCENES_WITH_ASSETS.filter((sc) => sc.projectId === DEMO_PROJECT_ID),
          ],
          shots: [...state.shots.filter((sh) => sh.projectId !== DEMO_PROJECT_ID), ...DEMO_SHOTS],
          edges: [...state.edges.filter((e) => !isDemoEdge(e)), ...DEMO_STORYBOARD_EDGES],
          assets: [
            ...state.assets.filter((a) => a.projectId !== DEMO_PROJECT_ID),
            ...DEMO_ASSETS.filter((a) => a.projectId === DEMO_PROJECT_ID),
          ],
          jobs: state.jobs.filter((j) => j.projectId !== DEMO_PROJECT_ID),
          assetJournal: [],
          selectedSceneId: DEMO_SCENES_WITH_ASSETS.find((sc) => sc.projectId === DEMO_PROJECT_ID)?.id ?? null,
          selectedShotId: DEMO_SHOTS[0]?.id ?? null,
          canvasViewport: { x: 0, y: 0, zoom: 0.75 },
          lastSavedAt: new Date().toISOString(),
        }))
        get().triggerSaveIndicator()
      },

      updateProject: (id, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now, lastSavedAt: now } : p
          ),
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.updateProjectCoreRemote(id, patch).catch((err) => get().reportSyncError('updateProject (core)', err))
          if (patch.logline !== undefined || patch.synopsis || patch.treatment || patch.vision || patch.artisticDossier || patch.workflow) {
            projectsRemote
              .upsertProjectCanonRemote(studioId, id, {
                logline: patch.logline,
                synopsis: patch.synopsis,
                treatment: patch.treatment,
                vision: patch.vision,
                artisticDossier: patch.artisticDossier,
                workflow: patch.workflow,
              })
              .catch((err) => get().reportSyncError('updateProject (canon)', err))
          }
        }
        get().triggerSaveIndicator()
      },

      toggleFavorite: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }))
        const isFavorite = get().projects.find((p) => p.id === id)?.isFavorite
        if (get().currentStudioId && isFavorite !== undefined) {
          projectsRemote.updateProjectCoreRemote(id, { isFavorite }).catch((err) => get().reportSyncError('toggleFavorite', err))
        }
      },

      archiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: !p.isArchived } : p
          ),
        }))
        const isArchived = get().projects.find((p) => p.id === id)?.isArchived
        if (get().currentStudioId && isArchived !== undefined) {
          projectsRemote.updateProjectCoreRemote(id, { isArchived }).catch((err) => get().reportSyncError('archiveProject', err))
        }
      },

      getProject: (slug) => {
        return get().projects.find((p) => p.slug === slug)
      },

      // ---- Logline ----

      saveLoglineVersion: (projectId, content, label) => {
        const now = new Date().toISOString()
        const version: LoglineVersion = {
          id: generateId(),
          content,
          wordCount: content.trim() === '' ? 0 : content.trim().split(/\s+/).length,
          savedAt: now,
          label,
        }
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              logline: content,
              loglineHistory: [version, ...p.loglineHistory].slice(0, 20),
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.addLoglineVersionRemote(studioId, projectId, version).catch((err) => get().reportSyncError('saveLoglineVersion', err))
          projectsRemote.upsertProjectCanonRemote(studioId, projectId, { logline: content }).catch((err) => get().reportSyncError('logline', err))
        }
        get().triggerSaveIndicator()
      },

      restoreLoglineVersion: (projectId, versionId) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) return
        const version = project.loglineHistory.find((v) => v.id === versionId)
        if (!version) return
        get().saveLoglineVersion(projectId, version.content, `Restauration: ${version.label ?? version.savedAt}`)
      },

      // ---- Script ----

      updateScript: (projectId, scenes) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, script: { scenes, lastSavedAt: now }, updatedAt: now, lastSavedAt: now }
              : p
          ),
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.replaceScriptScenesRemote(studioId, projectId, scenes).catch((err) => get().reportSyncError('updateScript', err))
        }
        get().triggerSaveIndicator()
      },

      // ---- Characters ----

      updateCharacter: (projectId, character) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              characters: p.characters.map((c) => (c.id === character.id ? character : c)),
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.upsertCharacterRemote(studioId, projectId, character).catch((err) => get().reportSyncError('updateCharacter', err))
        }
        get().triggerSaveIndicator()
      },

      addCharacter: (projectId, characterData) => {
        const character: Character = { ...characterData, id: generateId() }
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, characters: [...p.characters, character], updatedAt: now, lastSavedAt: now }
              : p
          ),
          lastSavedAt: now,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          projectsRemote.upsertCharacterRemote(studioId, projectId, character).catch((err) => {
            console.error('Rollback addCharacter', err)
            get().reportSyncError('addCharacter', err)
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId ? { ...p, characters: p.characters.filter((c) => c.id !== character.id) } : p
              ),
            }))
          })
        }
        get().triggerSaveIndicator()
      },

      removeCharacter: (projectId, characterId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, characters: p.characters.filter((c) => c.id !== characterId) }
              : p
          ),
        }))
        if (get().currentStudioId) {
          projectsRemote.deleteCharacterRemote(characterId).catch((err) => get().reportSyncError('removeCharacter', err))
        }
      },

      // ---- Artistic Dossier ----

      updateArtisticDossier: (projectId, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              artisticDossier: { ...p.artisticDossier, ...patch } as ArtisticDossier,
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        {
          const studioId = get().currentStudioId
          const artisticDossier = get().projects.find((p) => p.id === projectId)?.artisticDossier
          if (studioId && artisticDossier) {
            projectsRemote.upsertProjectCanonRemote(studioId, projectId, { artisticDossier }).catch((err) => get().reportSyncError('updateArtisticDossier', err))
          }
        }
        get().triggerSaveIndicator()
      },

      // ---- Vision ----

      updateVision: (projectId, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              vision: { ...p.vision, ...patch } as ProjectVision,
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        {
          const studioId = get().currentStudioId
          const vision = get().projects.find((p) => p.id === projectId)?.vision
          if (studioId && vision) {
            projectsRemote.upsertProjectCanonRemote(studioId, projectId, { vision }).catch((err) => get().reportSyncError('updateVision', err))
          }
        }
        get().triggerSaveIndicator()
      },

      // ---- Synopsis ----

      updateSynopsis: (projectId, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              synopsis: { ...p.synopsis, ...patch } as Synopsis,
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        {
          const studioId = get().currentStudioId
          const synopsis = get().projects.find((p) => p.id === projectId)?.synopsis
          if (studioId && synopsis) {
            projectsRemote.upsertProjectCanonRemote(studioId, projectId, { synopsis }).catch((err) => get().reportSyncError('updateSynopsis', err))
          }
        }
        get().triggerSaveIndicator()
      },

      // ---- Treatment ----

      updateTreatment: (projectId, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              treatment: { ...p.treatment, ...patch } as Treatment,
              updatedAt: now,
              lastSavedAt: now,
            }
          }),
          lastSavedAt: now,
        }))
        {
          const studioId = get().currentStudioId
          const treatment = get().projects.find((p) => p.id === projectId)?.treatment
          if (studioId && treatment) {
            projectsRemote.upsertProjectCanonRemote(studioId, projectId, { treatment }).catch((err) => get().reportSyncError('updateTreatment', err))
          }
        }
        get().triggerSaveIndicator()
      },

      // ---- Demo reset ----

      resetToDemo: () => {
        set({
          projects: DEMO_PROJECTS,
          sequences: DEMO_SEQUENCES,
          scenes: DEMO_SCENES_WITH_ASSETS,
          shots: DEMO_SHOTS,
          edges: DEMO_STORYBOARD_EDGES,
          assets: DEMO_ASSETS,
          assetJournal: [],
          jobs: [],
          demoIntroDismissed: false,
          tour: EMPTY_TOUR,
          canvasViewport: { x: 0, y: 0, zoom: 0.75 },
          selectedSceneId: DEMO_SCENES_WITH_ASSETS[0]?.id ?? null,
          selectedShotId: DEMO_SHOTS[0]?.id ?? null,
          lastSavedAt: new Date().toISOString(),
        })
      },

      // ---- Démonstration guidée ----

      dismissDemoIntro: () => set({ demoIntroDismissed: true }),

      startTour: (tourId, projectId) =>
        set((state) => ({
          demoIntroDismissed: true,
          tour: { ...state.tour, activeTourId: tourId, projectId, stepIndex: 0, skipped: false },
        })),

      goToTourStep: (index) =>
        set((state) => ({ tour: { ...state.tour, stepIndex: Math.max(0, index) } })),

      nextTourStep: (total) =>
        set((state) => ({
          tour: { ...state.tour, stepIndex: Math.min(total - 1, state.tour.stepIndex + 1) },
        })),

      prevTourStep: () =>
        set((state) => ({
          tour: { ...state.tour, stepIndex: Math.max(0, state.tour.stepIndex - 1) },
        })),

      skipTour: () =>
        set((state) => ({
          demoIntroDismissed: true,
          tour: { ...state.tour, activeTourId: null, projectId: null, skipped: true },
        })),

      exitTour: () =>
        set((state) => ({ tour: { ...state.tour, activeTourId: null, projectId: null } })),

      completeTour: () =>
        set((state) => ({
          tour: {
            ...state.tour,
            activeTourId: null,
            projectId: null,
            completedTourIds: state.tour.completedTourIds.includes(state.tour.activeTourId ?? '')
              ? state.tour.completedTourIds
              : [...state.tour.completedTourIds, state.tour.activeTourId ?? ''].filter(Boolean),
          },
        })),

      replayTour: (tourId, projectId) =>
        set((state) => ({
          demoIntroDismissed: true,
          tour: {
            ...state.tour,
            activeTourId: tourId,
            projectId,
            stepIndex: 0,
            skipped: false,
            completedTourIds: state.tour.completedTourIds.filter((id) => id !== tourId),
          },
        })),

      // ---- Save indicator ----

      triggerSaveIndicator: () => {
        set({ savedIndicator: true })
        setTimeout(() => set({ savedIndicator: false }), 2000)
      },

      reportSyncError: (context, err) => {
        console.error(`Sync ${context}`, err)
        set({ syncError: context })
      },
      dismissSyncError: () => set({ syncError: null }),

      // ==========================================================
      // Sprint 2 — Storyboard partagé (vue classique + canvas)
      // ==========================================================

      sequences: DEMO_SEQUENCES,
      scenes: DEMO_SCENES_WITH_ASSETS,
      shots: DEMO_SHOTS,
      edges: DEMO_STORYBOARD_EDGES,
      assets: DEMO_ASSETS,
      assetJournal: [],
      jobs: [],
      demoIntroDismissed: false,
      tour: EMPTY_TOUR,
      canvasViewport: { x: 0, y: 0, zoom: 0.75 },
      selectedSceneId: DEMO_SCENES_WITH_ASSETS[0]?.id ?? null,
      selectedShotId: DEMO_SHOTS[0]?.id ?? null,

      // ---- Sprint 4 State ----
      writingMissions: [],
      writingMessages: [],
      writingVariants: [],
      productionJobs: [],
      reviewComments: [],
      reviewChecklists: [],
      deliverablePackages: [],
      assetCollections: [],
      traces: [],

      // ---- V2 ----
      isV2Hydrated: false,
      currentStudioId: null,
      currentStudioRole: null,
      hydrationError: null,
      initV2: async () => {
        // Once hydrated with no studio (e.g. ran before sign-in completed),
        // allow a retry — only a *successful* studio load short-circuits.
        if (get().isV2Hydrated && get().currentStudioId) return;

        try {
          const studio = await resolveCurrentStudio();
          if (!studio) {
            set({ isV2Hydrated: true, currentStudioId: null, currentStudioRole: null, hydrationError: null });
            return;
          }

          let workspace = await fetchWorkspace(studio.id);
          if (workspace.projects.length === 0) {
            await bootstrapDemoData(studio.id);
            workspace = await fetchWorkspace(studio.id);
          }

          set({
            isV2Hydrated: true,
            currentStudioId: studio.id,
            currentStudioRole: studio.role,
            hydrationError: null,
            projects: workspace.projects,
            assets: workspace.assets,
            assetJournal: workspace.assetJournal,
            productionJobs: workspace.productionJobs,
            writingMissions: workspace.writingMissions,
            writingMessages: workspace.writingMessages,
            writingVariants: workspace.writingVariants,
            reviewComments: workspace.reviewComments,
            reviewChecklists: workspace.reviewChecklists,
            deliverablePackages: workspace.deliverablePackages,
            assetCollections: workspace.assetCollections,
            sequences: workspace.sequences,
            scenes: workspace.scenes,
            shots: workspace.shots,
            edges: workspace.edges,
            traces: workspace.projects.flatMap((p) => p.traces),
            selectedSceneId: workspace.scenes[0]?.id ?? null,
            selectedShotId: workspace.shots[0]?.id ?? null,
          });
        } catch (err) {
          // A failed load must never leave the UI stuck on the loading
          // spinner forever — surface it so AppShell can offer a retry.
          console.error('[initV2] Échec du chargement du studio', err);
          set({
            isV2Hydrated: true,
            currentStudioId: null,
            currentStudioRole: null,
            hydrationError: err instanceof Error ? err.message : 'Impossible de charger les données du studio.',
          });
        }
      },

      // ---- Auth ----

      addSequence: (projectId, patch) => {
        const siblings = get().sequences.filter((q) => q.projectId === projectId)
        const sequence: Sequence = {
          id: generateId(),
          projectId,
          number: siblings.length + 1,
          title: `Séquence ${siblings.length + 1}`,
          description: '',
          color: '#ececea',
          order: siblings.length,
          ...patch,
        }
        set((state) => ({ sequences: [...state.sequences, sequence] }))
        const studioId = get().currentStudioId
        if (studioId) {
          storyboardRemote.createSequenceRemote(studioId, sequence).catch((err) => {
            console.error('Rollback addSequence', err)
            get().reportSyncError('addSequence', err)
            set((state) => ({ sequences: state.sequences.filter((q) => q.id !== sequence.id) }))
          })
        }
        get().triggerSaveIndicator()
        return sequence
      },

      updateSequence: (sequenceId, patch) => {
        set((state) => ({
          sequences: state.sequences.map((q) => (q.id === sequenceId ? { ...q, ...patch } : q)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateSequenceRemote(sequenceId, patch).catch((err) => get().reportSyncError('updateSequence', err))
        }
        get().triggerSaveIndicator()
      },

      removeSequence: (sequenceId) => {
        const sceneIds = get().scenes.filter((sc) => sc.sequenceId === sequenceId).map((sc) => sc.id)
        set((state) => {
          const remainingScenes = state.scenes.filter((sc) => sc.sequenceId !== sequenceId)
          return {
            sequences: state.sequences.filter((q) => q.id !== sequenceId),
            scenes: remainingScenes,
            shots: state.shots.filter((sh) => !sceneIds.includes(sh.sceneId)),
            edges: state.edges.filter(
              (e) => !sceneIds.includes(e.source) && !sceneIds.includes(e.target)
            ),
            assets: state.assets.map((a) =>
              a.sceneId && sceneIds.includes(a.sceneId) ? { ...a, sceneId: undefined } : a
            ),
            selectedSceneId:
              state.selectedSceneId && sceneIds.includes(state.selectedSceneId)
                ? (remainingScenes[0]?.id ?? null)
                : state.selectedSceneId,
          }
        })
        if (get().currentStudioId) {
          ;(async () => {
            for (const sceneId of sceneIds) await storyboardRemote.deleteSceneRemote(sceneId)
            await storyboardRemote.deleteSequenceRemote(sequenceId)
          })().catch((err) => get().reportSyncError('removeSequence', err))
        }
        get().triggerSaveIndicator()
      },

      // ---- Scènes ----

      addScene: (sequenceId, patch) => {
        const state = get()
        const sequence = state.sequences.find((s) => s.id === sequenceId)
        const projectId = patch?.projectId ?? sequence?.projectId
        if (!projectId) {
          throw new Error(`Séquence introuvable, impossible de rattacher la scène : ${sequenceId}`)
        }
        const siblings = state.scenes.filter((s) => s.sequenceId === sequenceId)
        const maxNumber = state.scenes
          .filter((s) => s.projectId === projectId)
          .reduce((max, s) => Math.max(max, s.number), 0)

        const scene: StoryboardScene = {
          id: generateId(),
          sequenceId,
          projectId,
          number: maxNumber + 1,
          title: `Scène ${String(maxNumber + 1).padStart(2, '0')}`,
          location: 'Lieu à définir',
          timeOfDay: 'EXT',
          moment: 'Jour',
          emotion: 'À définir',
          intention: 'Intention à écrire.',
          description: '',
          lighting: 'diffuse',
          duration: 6,
          mainShotType: 'wide',
          order: siblings.length,
          canvasPosition: defaultCanvasPosition(sequence?.order ?? 0, siblings.length),
          notes: '',
          ...patch,
        }

        set((s) => ({ scenes: [...s.scenes, scene], selectedSceneId: scene.id }))
        const studioId = get().currentStudioId
        if (studioId) {
          storyboardRemote.createSceneRemote(studioId, scene).catch((err) => {
            console.error('Rollback addScene', err)
            get().reportSyncError('addScene', err)
            set((state) => ({ scenes: state.scenes.filter((s) => s.id !== scene.id) }))
          })
        }
        get().triggerSaveIndicator()
        return scene
      },

      updateScene: (sceneId, patch) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateSceneRemote(sceneId, patch).catch((err) => get().reportSyncError('updateScene', err))
        }
        get().triggerSaveIndicator()
      },

      removeScene: (sceneId) => {
        set((state) => {
          const scenes = state.scenes.filter((s) => s.id !== sceneId)
          return {
            scenes,
            // Les connexions de la scène disparaissent avec elle
            edges: state.edges.filter((e) => e.source !== sceneId && e.target !== sceneId),
            shots: state.shots.filter((shot) => shot.sceneId !== sceneId),
            // L'asset n'est jamais supprimé : il retourne au bac
            assets: state.assets.map((a) => (a.sceneId === sceneId ? { ...a, sceneId: undefined } : a)),
            selectedSceneId: state.selectedSceneId === sceneId ? (scenes[0]?.id ?? null) : state.selectedSceneId,
          }
        })
        if (get().currentStudioId) {
          storyboardRemote.deleteSceneRemote(sceneId).catch((err) => get().reportSyncError('removeScene', err))
        }
        get().triggerSaveIndicator()
      },

      duplicateScene: (sceneId) => {
        const state = get()
        const source = state.scenes.find((s) => s.id === sceneId)
        if (!source) return undefined
        const maxNumber = state.scenes.reduce((max, s) => Math.max(max, s.number), 0)
        const copy: StoryboardScene = {
          ...source,
          id: generateId(),
          number: maxNumber + 1,
          title: `${source.title} (copie)`,
          order: source.order + 1,
          canvasPosition: { x: source.canvasPosition.x + 40, y: source.canvasPosition.y + 40 },
        }
        const reordered = get().scenes.map((scene) =>
          scene.sequenceId === source.sequenceId && scene.order > source.order
            ? { ...scene, order: scene.order + 1 }
            : scene
        )
        set(() => ({
          scenes: [...reordered, copy],
          selectedSceneId: copy.id,
        }))
        const studioId = get().currentStudioId
        if (studioId) {
          ;(async () => {
            const bumped = reordered.filter((s) => s.sequenceId === source.sequenceId && s.order > source.order)
            for (const s of bumped) await storyboardRemote.updateSceneRemote(s.id, { order: s.order })
            await storyboardRemote.createSceneRemote(studioId, copy)
          })().catch((err) => get().reportSyncError('duplicateScene', err))
        }
        get().triggerSaveIndicator()
        return copy
      },

      moveSceneToSequence: (sceneId, sequenceId) => {
        const target = get().scenes.filter((s) => s.sequenceId === sequenceId)
        const order = target.length
        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === sceneId ? { ...s, sequenceId, order } : s
          ),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateSceneRemote(sceneId, { sequenceId, order }).catch((err) => get().reportSyncError('moveSceneToSequence', err))
        }
        get().triggerSaveIndicator()
      },

      reorderScenes: (sequenceId, orderedSceneIds) => {
        set((state) => ({
          scenes: state.scenes.map((scene) => {
            if (scene.sequenceId !== sequenceId) return scene
            const index = orderedSceneIds.indexOf(scene.id)
            return index === -1 ? scene : { ...scene, order: index }
          }),
        }))
        if (get().currentStudioId) {
          orderedSceneIds.forEach((sceneId, index) => {
            storyboardRemote.updateSceneRemote(sceneId, { order: index }).catch((err) => get().reportSyncError('reorderScenes', err))
          })
        }
        get().triggerSaveIndicator()
      },

      selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

      // ---- Canvas ----

      setSceneCanvasPosition: (sceneId, position) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, canvasPosition: position } : s)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateSceneRemote(sceneId, { canvasPosition: position }).catch((err) => get().reportSyncError('setSceneCanvasPosition', err))
        }
      },

      setCanvasViewport: (viewport) => set({ canvasViewport: viewport }),

      resetCanvasLayout: () => {
        const positioned = get().scenes.map((scene) => {
          const sequence = get().sequences.find((s) => s.id === scene.sequenceId)
          return { ...scene, canvasPosition: defaultCanvasPosition(sequence?.order ?? 0, scene.order) }
        })
        set(() => ({
          scenes: positioned,
          canvasViewport: { x: 0, y: 0, zoom: 0.75 },
        }))
        if (get().currentStudioId) {
          positioned.forEach((scene) => {
            storyboardRemote.updateSceneRemote(scene.id, { canvasPosition: scene.canvasPosition }).catch((err) => get().reportSyncError('resetCanvasLayout', err))
          })
        }
        get().triggerSaveIndicator()
      },

      // ---- Connexions ----

      addEdge: (source, target, type = 'sequential', label) => {
        if (source === target) return undefined
        const state = get()
        const exists = state.edges.some(
          (e) => e.source === source && e.target === target && e.type === type
        )
        if (exists) return undefined
        const edge: StoryboardEdge = { id: generateId(), source, target, type, label }
        set((s) => ({ edges: [...s.edges, edge] }))
        const studioId = get().currentStudioId
        const projectId = state.scenes.find((s) => s.id === source)?.projectId
        if (studioId && projectId) {
          storyboardRemote.createEdgeRemote(studioId, projectId, edge).catch((err) => {
            console.error('Rollback addEdge', err)
            get().reportSyncError('addEdge', err)
            set((s) => ({ edges: s.edges.filter((e) => e.id !== edge.id) }))
          })
        }
        get().triggerSaveIndicator()
        return edge
      },

      removeEdge: (edgeId) => {
        // Supprimer une connexion ne supprime jamais les scènes reliées
        set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) }))
        if (get().currentStudioId) {
          storyboardRemote.deleteEdgeRemote(edgeId).catch((err) => get().reportSyncError('removeEdge', err))
        }
        get().triggerSaveIndicator()
      },

      // ---- Plans ----

      addShot: (sceneId, patch) => {
        const state = get()
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (!scene) {
          throw new Error(`Scène introuvable, impossible de rattacher le plan : ${sceneId}`)
        }
        const projectId = scene.projectId
        const maxNumber = state.shots
          .filter((s) => s.projectId === projectId)
          .reduce((max, s) => Math.max(max, s.number), 0)
        const shot: Shot = {
          id: generateId(),
          sceneId,
          projectId,
          number: maxNumber + 1,
          type: scene.mainShotType ?? 'wide',
          focal: '35 mm',
          camera: 'ARRI Alexa 35',
          sensor: 'Super 35 — ALEV 4',
          ratio: '2.39:1',
          movement: 'static',
          angle: 'Niveau du regard',
          height: '1,60 m',
          filter: 'Aucun',
          duration: scene.duration,
          frameRate: 24,
          lighting: scene.lighting,
          decor: scene.location,
          continuity: `${scene.moment} — à préciser`,
          risks: '',
          references: [],
          notes: '',
          order: state.shots.filter((s) => s.projectId === projectId).length,
          validated: false,
          ...patch,
        }
        set((s) => ({ shots: [...s.shots, shot], selectedShotId: shot.id }))
        const studioId = get().currentStudioId
        if (studioId) {
          storyboardRemote.createShotRemote(studioId, shot).catch((err) => {
            console.error('Rollback addShot', err)
            get().reportSyncError('addShot', err)
            set((s) => ({ shots: s.shots.filter((sh) => sh.id !== shot.id) }))
          })
        }
        get().triggerSaveIndicator()
        return shot
      },

      updateShot: (shotId, patch) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, ...patch } : s)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateShotRemote(shotId, patch).catch((err) => get().reportSyncError('updateShot', err))
        }
        get().triggerSaveIndicator()
      },

      removeShot: (shotId) => {
        set((state) => {
          const shots = state.shots.filter((s) => s.id !== shotId)
          return {
            shots,
            selectedShotId: state.selectedShotId === shotId ? (shots[0]?.id ?? null) : state.selectedShotId,
          }
        })
        if (get().currentStudioId) {
          storyboardRemote.deleteShotRemote(shotId).catch((err) => get().reportSyncError('removeShot', err))
        }
        get().triggerSaveIndicator()
      },

      duplicateShot: (shotId) => {
        const state = get()
        const source = state.shots.find((s) => s.id === shotId)
        if (!source) return undefined
        const maxNumber = state.shots.reduce((max, s) => Math.max(max, s.number), 0)
        const copy: Shot = {
          ...source,
          id: generateId(),
          number: maxNumber + 1,
          order: state.shots.length,
          validated: false,
        }
        set((s) => ({ shots: [...s.shots, copy], selectedShotId: copy.id }))
        const studioId = get().currentStudioId
        if (studioId) {
          storyboardRemote.createShotRemote(studioId, copy).catch((err) => {
            console.error('Rollback duplicateShot', err)
            get().reportSyncError('duplicateShot', err)
            set((s) => ({ shots: s.shots.filter((sh) => sh.id !== copy.id) }))
          })
        }
        get().triggerSaveIndicator()
        return copy
      },

      setShotValidated: (shotId, validated) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, validated } : s)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateShotRemote(shotId, { validated }).catch((err) => get().reportSyncError('setShotValidated', err))
        }
        get().triggerSaveIndicator()
      },

      selectShot: (shotId) => set({ selectedShotId: shotId }),

      // ---- Assets ----

      addAsset: (asset) => {
        set((state) => ({ assets: [asset, ...state.assets] }))
        const studioId = get().currentStudioId
        if (studioId) {
          assetsRemote.createAssetRemote(studioId, asset).catch((err) => {
            console.error('Rollback addAsset', err)
            get().reportSyncError('addAsset', err)
            set((state) => ({ assets: state.assets.filter((a) => a.id !== asset.id) }))
          })
        }
        get().triggerSaveIndicator()
      },

      registerPreview: (preview, context) => {
        const asset: Asset = {
          id: preview.id,
          projectId: context.projectId,
          name: context.name,
          type: 'image',
          status: 'ephemeral',
          url: preview.url,
          prompt: preview.prompt,
          simulatedModel: preview.simulatedModel,
          sceneId: context.sceneId,
          createdAt: preview.generatedAt,
          expiresAt: computeExpiry(preview.generatedAt),
          metadata: context.metadata ?? {},
          versions: [],
          relations: [],
        }
        set((state) => ({ assets: [asset, ...state.assets] }))
        const entry = appendJournal(set, {
          assetId: asset.id,
          assetName: asset.name,
          action: 'Prévisualisation locale générée',
          to: 'ephemeral',
          note: preview.disclaimer,
        })
        const studioId = get().currentStudioId
        if (studioId) {
          assetsRemote.createAssetRemote(studioId, asset).catch((err) => get().reportSyncError('registerPreview (asset)', err))
          assetsRemote.addJournalEntryRemote(studioId, context.projectId, entry).catch((err) => get().reportSyncError('registerPreview (journal)', err))
        }
        get().triggerSaveIndicator()
        return asset
      },

      setAssetStatus: (assetId, status, options = {}) => {
        const asset = get().assets.find((a) => a.id === assetId)
        if (!asset) return { allowed: false, reason: 'Asset introuvable.' }

        const check = checkTransition(asset.status, status, options)
        if (!check.allowed) return check

        const now = new Date().toISOString()
        const newVersion = { id: generateId(), url: asset.url, prompt: asset.prompt ?? '', createdAt: now, status }
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  status,
                  expiresAt: status === 'ephemeral' ? a.expiresAt : undefined,
                  approvedAt: status === 'approved' || status === 'canonical' ? now : a.approvedAt,
                  approvedBy:
                    status === 'approved' || status === 'canonical' ? DECIDED_BY : a.approvedBy,
                  versions: [...a.versions, newVersion],
                }
              : a
          ),
        }))
        const entry = appendJournal(set, {
          assetId,
          assetName: asset.name,
          action: 'Changement de statut',
          from: asset.status,
          to: status,
        })
        const studioId = get().currentStudioId
        if (studioId) {
          assetsRemote.updateAssetRemote(assetId, {
            status,
            expiresAt: status === 'ephemeral' ? asset.expiresAt : undefined,
          }).catch((err) => get().reportSyncError('setAssetStatus', err))
          assetsRemote.addAssetVersionRemote(studioId, asset.projectId, assetId, newVersion).catch((err) => get().reportSyncError('setAssetStatus (version)', err))
          assetsRemote.addJournalEntryRemote(studioId, asset.projectId, entry).catch((err) => get().reportSyncError('setAssetStatus (journal)', err))
        }
        get().triggerSaveIndicator()
        return check
      },

      promoteAssetToCanonical: (assetId) =>
        get().setAssetStatus(assetId, 'canonical', { humanAction: true }),

      deleteAsset: (assetId) => get().setAssetStatus(assetId, 'deleted', { humanAction: true }),

      restoreAndApproveAsset: (assetId) => {
        const asset = get().assets.find((a) => a.id === assetId)
        if (!asset) return { allowed: false, reason: 'Asset introuvable.' }

        const check = checkTransition(asset.status, 'approved', { humanAction: true })
        if (!check.allowed) return check

        const now = new Date().toISOString()
        const newVersion = { id: generateId(), url: asset.url, prompt: asset.prompt ?? '', createdAt: now, status: 'approved' as AssetStatus }
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  status: 'approved',
                  // L'expiration est annulée, les métadonnées sont conservées
                  expiresAt: undefined,
                  approvedAt: now,
                  approvedBy: DECIDED_BY,
                  versions: [...a.versions, newVersion],
                }
              : a
          ),
        }))
        const entry = appendJournal(set, {
          assetId,
          assetName: asset.name,
          action: 'Restaurer et valider',
          from: asset.status,
          to: 'approved',
          note: 'Expiration annulée, métadonnées conservées.',
        })
        const studioId = get().currentStudioId
        if (studioId) {
          assetsRemote.updateAssetRemote(assetId, { status: 'approved', expiresAt: undefined }).catch((err) => get().reportSyncError('restoreAndApproveAsset', err))
          assetsRemote.addAssetVersionRemote(studioId, asset.projectId, assetId, newVersion).catch((err) => get().reportSyncError('restoreAndApproveAsset (version)', err))
          assetsRemote.addJournalEntryRemote(studioId, asset.projectId, entry).catch((err) => get().reportSyncError('restoreAndApproveAsset (journal)', err))
        }
        get().triggerSaveIndicator()
        return check
      },

      attachAssetToScene: (assetId, sceneId) => {
        set((state) => ({
          assets: state.assets.map((a) => (a.id === assetId ? { ...a, sceneId } : a)),
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, assetId } : s)),
        }))
        if (get().currentStudioId) {
          assetsRemote.updateAssetRemote(assetId, { sceneId }).catch((err) => get().reportSyncError('attachAssetToScene (asset)', err))
          storyboardRemote.updateSceneRemote(sceneId, { assetId }).catch((err) => get().reportSyncError('attachAssetToScene (scene)', err))
        }
        get().triggerSaveIndicator()
      },

      attachAssetToShot: (assetId, shotId) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, assetId } : s)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateShotRemote(shotId, { assetId }).catch((err) => get().reportSyncError('attachAssetToShot', err))
        }
        get().triggerSaveIndicator()
      },

      detachAssetFromScene: (sceneId) => {
        const detachedAssetIds = get().assets.filter((a) => a.sceneId === sceneId).map((a) => a.id)
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, assetId: undefined } : s)),
          assets: state.assets.map((a) => (a.sceneId === sceneId ? { ...a, sceneId: undefined } : a)),
        }))
        if (get().currentStudioId) {
          storyboardRemote.updateSceneRemote(sceneId, { assetId: undefined }).catch((err) => get().reportSyncError('detachAssetFromScene (scene)', err))
          detachedAssetIds.forEach((assetId) => {
            assetsRemote.updateAssetRemote(assetId, { sceneId: undefined }).catch((err) => get().reportSyncError('detachAssetFromScene (asset)', err))
          })
        }
        get().triggerSaveIndicator()
      },

      // ---- Sprint 4 Actions ----

      addWritingMission: (projectId, title, target, context) => {
        const mission: WritingMission = { id: generateId(), projectId, title, target, context, createdAt: new Date().toISOString() }
        set((state) => ({ writingMissions: [...state.writingMissions, mission] }))

        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createMissionRemote(studioId, mission).catch((err) => {
            console.error('Rollback addWritingMission', err)
            get().reportSyncError('addWritingMission', err)
            set((state) => ({ writingMissions: state.writingMissions.filter((m) => m.id !== mission.id) }))
          })
        }

        get().triggerSaveIndicator()
        return mission
      },
      addWritingMessage: (missionId, role, content, classification) => {
        const message: WritingMessage = { id: generateId(), missionId, role, content, classification, createdAt: new Date().toISOString() }
        set((state) => ({ writingMessages: [...state.writingMessages, message] }))

        const studioId = get().currentStudioId
        const mission = get().writingMissions.find((m) => m.id === missionId)
        if (studioId && mission) {
          sprint4Remote.createMessageRemote(studioId, mission.projectId, message).catch((err) => get().reportSyncError('addWritingMessage', err))
        }

        get().triggerSaveIndicator()
        return message
      },
      addWritingVariant: (missionId, label, content, target) => {
        const variant: WritingVariant = { id: generateId(), missionId, label, content, target, selected: false, createdAt: new Date().toISOString() }
        set((state) => ({ writingVariants: [...state.writingVariants, variant] }))
        const studioId = get().currentStudioId
        const mission = get().writingMissions.find((m) => m.id === missionId)
        if (studioId && mission) {
          sprint4Remote.createVariantRemote(studioId, mission.projectId, variant).catch((err) => get().reportSyncError('addWritingVariant', err))
        }
        get().triggerSaveIndicator()
        return variant
      },
      selectWritingVariant: (variantId) => {
        let missionId: string | undefined
        set((state) => {
          const variant = state.writingVariants.find(v => v.id === variantId)
          if (!variant) return state
          missionId = variant.missionId
          return {
            writingVariants: state.writingVariants.map(v =>
              v.missionId === variant.missionId
                ? { ...v, selected: v.id === variantId }
                : v
            )
          }
        })
        if (get().currentStudioId && missionId) {
          sprint4Remote.selectVariantRemote(missionId, variantId).catch((err) => get().reportSyncError('selectWritingVariant', err))
        }
        get().triggerSaveIndicator()
      },
      removeWritingMission: (missionId) => {
        set((state) => ({
          writingMissions: state.writingMissions.filter(m => m.id !== missionId),
          writingMessages: state.writingMessages.filter(m => m.missionId !== missionId),
          writingVariants: state.writingVariants.filter(v => v.missionId !== missionId)
        }))
        if (get().currentStudioId) {
          sprint4Remote.deleteMissionRemote(missionId).catch((err) => get().reportSyncError('removeWritingMission', err))
        }
        get().triggerSaveIndicator()
      },

      addProductionJob: (job) => {
        const now = new Date().toISOString()
        const newJob: ProductionJob = { ...job, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({ productionJobs: [...state.productionJobs, newJob] }))

        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createJobRemote(studioId, newJob).catch((err) => {
            console.error('Rollback addProductionJob', err)
            get().reportSyncError('addProductionJob', err)
            set((state) => ({ productionJobs: state.productionJobs.filter(j => j.id !== newJob.id) }))
          })
        }

        get().triggerSaveIndicator()
        return newJob
      },
      updateProductionJob: (jobId, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, ...patch, updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, patch).catch((err) => get().reportSyncError('updateProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      startProductionJob: (jobId) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, status: 'running', startedAt: now, updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, { status: 'running', startedAt: now }).catch((err) => get().reportSyncError('startProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      completeProductionJob: (jobId, resultAssetId) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, status: 'review_required', resultAssetId, completedAt: now, updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, { status: 'review_required', resultAssetId, completedAt: now }).catch((err) => get().reportSyncError('completeProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      approveProductionJob: (jobId) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, status: 'approved', updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, { status: 'approved' }).catch((err) => get().reportSyncError('approveProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      failProductionJob: (jobId, error) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, status: 'failed', error, updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, { status: 'failed', error }).catch((err) => get().reportSyncError('failProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      cancelProductionJob: (jobId) => {
        const now = new Date().toISOString()
        set((state) => ({
          productionJobs: state.productionJobs.map((j) => (j.id === jobId ? { ...j, status: 'cancelled', updatedAt: now } : j)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateJobRemote(jobId, { status: 'cancelled' }).catch((err) => get().reportSyncError('cancelProductionJob', err))
        }
        get().triggerSaveIndicator()
      },
      duplicateProductionJob: (jobId) => {
        const state = get()
        const job = state.productionJobs.find(j => j.id === jobId)
        if (!job) return undefined
        const { id: _id, createdAt: _c, updatedAt: _u, startedAt: _s, completedAt: _ca, resultAssetId: _ra, error: _e, ...rest } = job
        return get().addProductionJob({ ...rest, status: 'draft' })
      },
      retryProductionJob: (jobId) => {
        const state = get()
        const job = state.productionJobs.find(j => j.id === jobId)
        if (!job) return undefined
        const { id: _id, createdAt: _c, updatedAt: _u, startedAt: _s, completedAt: _ca, resultAssetId: _ra, error: _e, ...rest } = job
        return get().addProductionJob({ ...rest, status: 'queued' })
      },

      addReviewComment: (projectId, assetId, content) => {
        const comment: ReviewComment = { id: generateId(), projectId, assetId, content, author: 'User', createdAt: new Date().toISOString() }
        set((state) => ({ reviewComments: [...state.reviewComments, comment] }))
        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createReviewCommentRemote(studioId, comment).catch((err) => {
            console.error('Rollback addReviewComment', err)
            get().reportSyncError('addReviewComment', err)
            set((state) => ({ reviewComments: state.reviewComments.filter((c) => c.id !== comment.id) }))
          })
        }
        get().triggerSaveIndicator()
        return comment
      },
      removeReviewComment: (commentId) => {
        set((state) => ({ reviewComments: state.reviewComments.filter(c => c.id !== commentId) }))
        if (get().currentStudioId) {
          sprint4Remote.deleteReviewCommentRemote(commentId).catch((err) => get().reportSyncError('removeReviewComment', err))
        }
        get().triggerSaveIndicator()
      },
      addReviewChecklist: (projectId, assetId, label) => {
        const checklist: ReviewChecklist = { id: generateId(), projectId, assetId, label, checked: false }
        set((state) => ({ reviewChecklists: [...state.reviewChecklists, checklist] }))
        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createChecklistItemRemote(studioId, checklist).catch((err) => {
            console.error('Rollback addReviewChecklist', err)
            get().reportSyncError('addReviewChecklist', err)
            set((state) => ({ reviewChecklists: state.reviewChecklists.filter((c) => c.id !== checklist.id) }))
          })
        }
        get().triggerSaveIndicator()
        return checklist
      },
      toggleReviewChecklist: (checklistId) => {
        let nextChecked = false
        set((state) => ({
          reviewChecklists: state.reviewChecklists.map((c) => {
            if (c.id !== checklistId) return c
            nextChecked = !c.checked
            return { ...c, checked: nextChecked }
          }),
        }))
        if (get().currentStudioId) {
          sprint4Remote.toggleChecklistItemRemote(checklistId, nextChecked).catch((err) => get().reportSyncError('toggleReviewChecklist', err))
        }
        get().triggerSaveIndicator()
      },

      createDeliverablePackage: (projectId, title) => {
        const pack: DeliverablePackage = { id: generateId(), projectId, title, sections: [], createdAt: new Date().toISOString() }
        set((state) => ({ deliverablePackages: [...state.deliverablePackages, pack] }))
        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createDeliverableRemote(studioId, pack).catch((err) => {
            console.error('Rollback createDeliverablePackage', err)
            get().reportSyncError('createDeliverablePackage', err)
            set((state) => ({ deliverablePackages: state.deliverablePackages.filter((p) => p.id !== pack.id) }))
          })
        }
        get().triggerSaveIndicator()
        return pack
      },
      updateDeliverableSection: (packageId, sectionId, included) => {
        set((state) => ({
          deliverablePackages: state.deliverablePackages.map((p) => (p.id === packageId ? { ...p, sections: p.sections.map(s => s.id === sectionId ? { ...s, included } : s) } : p)),
        }))
        const sections = get().deliverablePackages.find((p) => p.id === packageId)?.sections
        if (get().currentStudioId && sections) {
          sprint4Remote.updateDeliverableRemote(packageId, { sections }).catch((err) => get().reportSyncError('updateDeliverableSection', err))
        }
        get().triggerSaveIndicator()
      },
      markDeliverableExported: (packageId) => {
        const exportedAt = new Date().toISOString()
        set((state) => ({
          deliverablePackages: state.deliverablePackages.map((p) => (p.id === packageId ? { ...p, exportedAt } : p)),
        }))
        if (get().currentStudioId) {
          sprint4Remote.updateDeliverableRemote(packageId, { exportedAt }).catch((err) => get().reportSyncError('markDeliverableExported', err))
        }
        get().triggerSaveIndicator()
      },

      addAssetCollection: (projectId, name) => {
        const collection: AssetCollection = { id: generateId(), projectId, name, assetIds: [], createdAt: new Date().toISOString() }
        set((state) => ({ assetCollections: [...state.assetCollections, collection] }))
        const studioId = get().currentStudioId
        if (studioId) {
          sprint4Remote.createAssetCollectionRemote(studioId, collection).catch((err) => {
            console.error('Rollback addAssetCollection', err)
            get().reportSyncError('addAssetCollection', err)
            set((state) => ({ assetCollections: state.assetCollections.filter((c) => c.id !== collection.id) }))
          })
        }
        get().triggerSaveIndicator()
        return collection
      },
      addAssetToCollection: (collectionId, assetId) => {
        set((state) => ({
          assetCollections: state.assetCollections.map((c) => (c.id === collectionId && !c.assetIds.includes(assetId) ? { ...c, assetIds: [...c.assetIds, assetId] } : c)),
        }))
        const assetIds = get().assetCollections.find((c) => c.id === collectionId)?.assetIds
        if (get().currentStudioId && assetIds) {
          sprint4Remote.updateAssetCollectionRemote(collectionId, assetIds).catch((err) => get().reportSyncError('addAssetToCollection', err))
        }
        get().triggerSaveIndicator()
      },
      removeAssetFromCollection: (collectionId, assetId) => {
        set((state) => ({
          assetCollections: state.assetCollections.map((c) => (c.id === collectionId ? { ...c, assetIds: c.assetIds.filter(id => id !== assetId) } : c)),
        }))
        const assetIds = get().assetCollections.find((c) => c.id === collectionId)?.assetIds
        if (get().currentStudioId && assetIds) {
          sprint4Remote.updateAssetCollectionRemote(collectionId, assetIds).catch((err) => get().reportSyncError('removeAssetFromCollection', err))
        }
        get().triggerSaveIndicator()
      },
      removeAssetCollection: (collectionId) => {
        set((state) => ({ assetCollections: state.assetCollections.filter(c => c.id !== collectionId) }))
        if (get().currentStudioId) {
          sprint4Remote.deleteAssetCollectionRemote(collectionId).catch((err) => get().reportSyncError('removeAssetCollection', err))
        }
        get().triggerSaveIndicator()
      }
    }),
    {
      name: 'museion-store-v1',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        tour: state.tour,
        demoIntroDismissed: state.demoIntroDismissed,
        canvasViewport: state.canvasViewport,
      }),
      // localStorage n'existe pas au rendu serveur : réhydrater pendant la
      // création du store ferait diverger le premier rendu client du HTML
      // envoyé par le serveur. La réhydratation est déclenchée après montage
      // par <StoreHydration />.
      skipHydration: true,
      migrate: (persistedState, version) => {
        let state = persistedState as MuseionState

        if (version < 1) {
          state = { ...state, schemaVersion: 1 }
        }

        // v1 → v2 : introduction du storyboard partagé (séquences, scènes,
        // plans, connexions, assets). Les données existantes sont conservées.
        if (version < 2) {
          state = {
            ...state,
            schemaVersion: 2,
            sequences: DEMO_SEQUENCES,
            scenes: DEMO_SCENES_WITH_ASSETS,
            shots: DEMO_SHOTS,
            edges: DEMO_STORYBOARD_EDGES,
            assets: DEMO_ASSETS,
            assetJournal: [],
            canvasViewport: { x: 0, y: 0, zoom: 0.75 },
            selectedSceneId: DEMO_SCENES_WITH_ASSETS[0]?.id ?? null,
            selectedShotId: DEMO_SHOTS[0]?.id ?? null,
          }
        }

        // v2 → v3 : workflow par projet, file de production, démonstration guidée
        if (version < 3) {
          state = {
            ...state,
            schemaVersion: 3,
            projects: (state.projects ?? []).map((p) => ({
              ...p,
              workflow: p.workflow ?? createWorkflow(),
              isDemo: p.id === DEMO_PROJECT_ID ? true : p.isDemo,
              demoVersion: p.id === DEMO_PROJECT_ID ? '1.0.0' : p.demoVersion,
            })),
            jobs: state.jobs ?? [],
            demoIntroDismissed: state.demoIntroDismissed ?? false,
            tour: state.tour ?? EMPTY_TOUR,
          }
        }

        // v3 → v4 : Sprint 4 - Writing, Production Jobs, Review, Deliverables, Collections
        if (version < 4) {
          state = {
            ...state,
            schemaVersion: 4,
            writingMissions: state.writingMissions ?? [],
            writingMessages: state.writingMessages ?? [],
            writingVariants: state.writingVariants ?? [],
            productionJobs: state.productionJobs ?? [],
            reviewComments: state.reviewComments ?? [],
            reviewChecklists: state.reviewChecklists ?? [],
            deliverablePackages: state.deliverablePackages ?? [],
            assetCollections: state.assetCollections ?? [],
          }
        }

        return state
      },
    }
  )
)

// Sélecteurs utilitaires

export const selectProjects = (state: MuseionState) => state.projects
export const selectAuth = (state: MuseionState) => state.auth
export const selectProfile = (state: MuseionState) => state.studioProfile
export const selectSavedIndicator = (state: MuseionState) => state.savedIndicator
