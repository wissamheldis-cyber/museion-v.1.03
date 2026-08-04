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

// ============================================================
// Schema versionné
// ============================================================

const SCHEMA_VERSION = 3

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

  // Auth
  setAuth: (session: AuthSession | null) => void
  setProfile: (profile: StudioProfile | null) => void
  signOut: () => void

  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  createProject: (
    input: NewProjectInput
  ) => { ok: true; project: Project } | { ok: false; errors: FieldErrors }
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
) {
  set((state) => ({
    assetJournal: [
      {
        ...entry,
        id: generateId(),
        decidedBy: DECIDED_BY,
        decidedAt: new Date().toISOString(),
      },
      ...state.assetJournal,
    ].slice(0, 200),
  }))
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

      // ---- Auth ----

      setAuth: (session) => {
        set({ auth: session })
      },

      setProfile: (profile) => {
        set({ studioProfile: profile })
      },

      signOut: () => {
        set({ auth: null, studioProfile: null })
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
        get().triggerSaveIndicator()
        return project
      },

      createProject: (input) => {
        const result = validateNewProject(input)
        if (!result.ok) return result

        const project = bootstrapProject(result.data, {
          existingSlugs: get().projects.map((p) => p.slug),
        })

        set((state) => ({
          projects: [project, ...state.projects],
          lastSavedAt: project.createdAt,
        }))
        get().triggerSaveIndicator()
        return { ok: true, project }
      },

      duplicateProject: (projectId, title) => {
        const state = get()
        const source = state.projects.find((p) => p.id === projectId)
        if (!source) return undefined

        const now = new Date().toISOString()
        const newId = `proj-${generateId()}`
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
            ...DEMO_SEQUENCES,
          ],
          scenes: [
            ...state.scenes.filter((sc) => sc.projectId !== DEMO_PROJECT_ID),
            ...DEMO_SCENES_WITH_ASSETS,
          ],
          shots: [...state.shots.filter((sh) => sh.projectId !== DEMO_PROJECT_ID), ...DEMO_SHOTS],
          edges: [...state.edges.filter((e) => !isDemoEdge(e)), ...DEMO_STORYBOARD_EDGES],
          assets: [...state.assets.filter((a) => a.projectId !== DEMO_PROJECT_ID), ...DEMO_ASSETS],
          jobs: state.jobs.filter((j) => j.projectId !== DEMO_PROJECT_ID),
          assetJournal: [],
          selectedSceneId: DEMO_SCENES_WITH_ASSETS[0]?.id ?? null,
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
        get().triggerSaveIndicator()
      },

      toggleFavorite: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }))
      },

      archiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: !p.isArchived } : p
          ),
        }))
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

      // ---- Séquences ----

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
        get().triggerSaveIndicator()
        return sequence
      },

      updateSequence: (sequenceId, patch) => {
        set((state) => ({
          sequences: state.sequences.map((q) => (q.id === sequenceId ? { ...q, ...patch } : q)),
        }))
        get().triggerSaveIndicator()
      },

      removeSequence: (sequenceId) => {
        set((state) => {
          const sceneIds = state.scenes.filter((sc) => sc.sequenceId === sequenceId).map((sc) => sc.id)
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
        get().triggerSaveIndicator()
        return scene
      },

      updateScene: (sceneId, patch) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
        }))
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
        set((s) => ({
          scenes: [
            ...s.scenes.map((scene) =>
              scene.sequenceId === source.sequenceId && scene.order > source.order
                ? { ...scene, order: scene.order + 1 }
                : scene
            ),
            copy,
          ],
          selectedSceneId: copy.id,
        }))
        get().triggerSaveIndicator()
        return copy
      },

      moveSceneToSequence: (sceneId, sequenceId) => {
        set((state) => {
          const target = state.scenes.filter((s) => s.sequenceId === sequenceId)
          return {
            scenes: state.scenes.map((s) =>
              s.id === sceneId ? { ...s, sequenceId, order: target.length } : s
            ),
          }
        })
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
        get().triggerSaveIndicator()
      },

      selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

      // ---- Canvas ----

      setSceneCanvasPosition: (sceneId, position) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, canvasPosition: position } : s)),
        }))
      },

      setCanvasViewport: (viewport) => set({ canvasViewport: viewport }),

      resetCanvasLayout: () => {
        set((state) => ({
          scenes: state.scenes.map((scene) => {
            const sequence = state.sequences.find((s) => s.id === scene.sequenceId)
            return {
              ...scene,
              canvasPosition: defaultCanvasPosition(sequence?.order ?? 0, scene.order),
            }
          }),
          canvasViewport: { x: 0, y: 0, zoom: 0.75 },
        }))
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
        get().triggerSaveIndicator()
        return edge
      },

      removeEdge: (edgeId) => {
        // Supprimer une connexion ne supprime jamais les scènes reliées
        set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) }))
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
        get().triggerSaveIndicator()
        return shot
      },

      updateShot: (shotId, patch) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, ...patch } : s)),
        }))
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
        get().triggerSaveIndicator()
        return copy
      },

      setShotValidated: (shotId, validated) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, validated } : s)),
        }))
        get().triggerSaveIndicator()
      },

      selectShot: (shotId) => set({ selectedShotId: shotId }),

      // ---- Assets ----

      addAsset: (asset) => {
        set((state) => ({ assets: [asset, ...state.assets] }))
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
        appendJournal(set, {
          assetId: asset.id,
          assetName: asset.name,
          action: 'Prévisualisation locale générée',
          to: 'ephemeral',
          note: preview.disclaimer,
        })
        get().triggerSaveIndicator()
        return asset
      },

      setAssetStatus: (assetId, status, options = {}) => {
        const asset = get().assets.find((a) => a.id === assetId)
        if (!asset) return { allowed: false, reason: 'Asset introuvable.' }

        const check = checkTransition(asset.status, status, options)
        if (!check.allowed) return check

        const now = new Date().toISOString()
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
                  versions: [
                    ...a.versions,
                    { id: generateId(), url: a.url, prompt: a.prompt ?? '', createdAt: now, status },
                  ],
                }
              : a
          ),
        }))
        appendJournal(set, {
          assetId,
          assetName: asset.name,
          action: 'Changement de statut',
          from: asset.status,
          to: status,
        })
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
                  versions: [
                    ...a.versions,
                    {
                      id: generateId(),
                      url: a.url,
                      prompt: a.prompt ?? '',
                      createdAt: now,
                      status: 'approved' as AssetStatus,
                    },
                  ],
                }
              : a
          ),
        }))
        appendJournal(set, {
          assetId,
          assetName: asset.name,
          action: 'Restaurer et valider',
          from: asset.status,
          to: 'approved',
          note: 'Expiration annulée, métadonnées conservées.',
        })
        get().triggerSaveIndicator()
        return check
      },

      attachAssetToScene: (assetId, sceneId) => {
        set((state) => ({
          assets: state.assets.map((a) => (a.id === assetId ? { ...a, sceneId } : a)),
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, assetId } : s)),
        }))
        get().triggerSaveIndicator()
      },

      attachAssetToShot: (assetId, shotId) => {
        set((state) => ({
          shots: state.shots.map((s) => (s.id === shotId ? { ...s, assetId } : s)),
        }))
        get().triggerSaveIndicator()
      },

      detachAssetFromScene: (sceneId) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, assetId: undefined } : s)),
          assets: state.assets.map((a) => (a.sceneId === sceneId ? { ...a, sceneId: undefined } : a)),
        }))
        get().triggerSaveIndicator()
      },
    }),
    {
      name: 'museion-store-v1',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
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
