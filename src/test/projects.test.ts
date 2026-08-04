import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useMuseionStore, DEMO_PROJECT_ID, DEMO_TOUR_ID } from '@/store/museionStore'
import {
  bootstrapProject,
  uniqueSlug,
  validateNewProject,
} from '@/lib/projectBootstrapper'
import { workflowProgress, WORKFLOW_DEFINITION } from '@/lib/workflow'
import { GILGAMESH_TOUR } from '@/lib/tour/gilgameshTour'
import type { Project } from '@/lib/types'

// Ces tests portent sur la logique locale du store (slugs, structure des
// projets, isolation, visite guidée) — pas sur Supabase. On neutralise tout
// l'adaptateur distant en no-ops résolus, pour qu'aucun appel réseau réel
// ne parte pendant ces tests, quelle que soit l'action du store déclenchée.
vi.mock('@/adapters/supabase/studios', () => ({
  resolveCurrentStudio: vi.fn().mockResolvedValue(null),
  createStudioForCurrentUser: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/projects', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
  createProjectRemote: vi.fn().mockResolvedValue(undefined),
  deleteProjectRemote: vi.fn().mockResolvedValue(undefined),
  updateProjectCoreRemote: vi.fn().mockResolvedValue(undefined),
  upsertProjectCanonRemote: vi.fn().mockResolvedValue(undefined),
  addLoglineVersionRemote: vi.fn().mockResolvedValue(undefined),
  upsertCharacterRemote: vi.fn().mockResolvedValue(undefined),
  deleteCharacterRemote: vi.fn().mockResolvedValue(undefined),
  replaceScriptScenesRemote: vi.fn().mockResolvedValue(undefined),
  addTraceRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/storyboard', () => ({
  fetchStoryboard: vi.fn().mockResolvedValue({ sequences: [], scenes: [], shots: [], edges: [] }),
  createSequenceRemote: vi.fn().mockResolvedValue(undefined),
  updateSequenceRemote: vi.fn().mockResolvedValue(undefined),
  deleteSequenceRemote: vi.fn().mockResolvedValue(undefined),
  createSceneRemote: vi.fn().mockResolvedValue(undefined),
  updateSceneRemote: vi.fn().mockResolvedValue(undefined),
  deleteSceneRemote: vi.fn().mockResolvedValue(undefined),
  createShotRemote: vi.fn().mockResolvedValue(undefined),
  updateShotRemote: vi.fn().mockResolvedValue(undefined),
  deleteShotRemote: vi.fn().mockResolvedValue(undefined),
  createEdgeRemote: vi.fn().mockResolvedValue(undefined),
  deleteEdgeRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/assets', () => ({
  fetchAssets: vi.fn().mockResolvedValue({ assets: [], journal: [] }),
  createAssetRemote: vi.fn().mockResolvedValue(undefined),
  updateAssetRemote: vi.fn().mockResolvedValue(undefined),
  addAssetVersionRemote: vi.fn().mockResolvedValue(undefined),
  addJournalEntryRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/sprint4', () => ({
  fetchSprint4: vi.fn().mockResolvedValue({
    writingMissions: [], writingMessages: [], writingVariants: [], productionJobs: [],
    reviewComments: [], reviewChecklists: [], deliverablePackages: [], assetCollections: [],
  }),
  createMissionRemote: vi.fn().mockResolvedValue(undefined),
  deleteMissionRemote: vi.fn().mockResolvedValue(undefined),
  createMessageRemote: vi.fn().mockResolvedValue(undefined),
  createVariantRemote: vi.fn().mockResolvedValue(undefined),
  selectVariantRemote: vi.fn().mockResolvedValue(undefined),
  createJobRemote: vi.fn().mockResolvedValue(undefined),
  updateJobRemote: vi.fn().mockResolvedValue(undefined),
  createReviewCommentRemote: vi.fn().mockResolvedValue(undefined),
  deleteReviewCommentRemote: vi.fn().mockResolvedValue(undefined),
  createChecklistItemRemote: vi.fn().mockResolvedValue(undefined),
  toggleChecklistItemRemote: vi.fn().mockResolvedValue(undefined),
  createDeliverableRemote: vi.fn().mockResolvedValue(undefined),
  updateDeliverableRemote: vi.fn().mockResolvedValue(undefined),
  createAssetCollectionRemote: vi.fn().mockResolvedValue(undefined),
  updateAssetCollectionRemote: vi.fn().mockResolvedValue(undefined),
  deleteAssetCollectionRemote: vi.fn().mockResolvedValue(undefined),
}))

const TEST_STUDIO_ID = 'studio-test-0000-0000-000000000000'

function store() {
  return useMuseionStore.getState()
}

/** Crée un projet et renvoie l'objet créé, ou échoue le test. */
async function create(input: Parameters<ReturnType<typeof store>['createProject']>[0]): Promise<Project> {
  let created: Project | undefined
  await act(async () => {
    const result = await store().createProject(input)
    if (result.ok) created = result.project
  })
  if (!created) throw new Error('Le projet n’a pas pu être créé')
  return created
}

const PROJECT_A = {
  title: 'Projet A',
  logline: 'Une cartographe perd la carte du seul pays qu’elle connaisse.',
  format: 'feature' as const,
  genre: 'drama' as const,
}

const PROJECT_B = {
  title: 'Projet B',
  logline: 'Un horloger règle une horloge qui avance sur sa propre vie.',
  format: 'short' as const,
  genre: 'thriller' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  act(() => {
    store().resetToDemo()
    // La plupart de ces tests portent sur la logique locale, pas sur la
    // présence d'un studio Supabase réel : on en simule un pour que
    // createProject() n'échoue pas sur le nouveau garde-fou studioId.
    useMuseionStore.setState({ currentStudioId: TEST_STUDIO_ID, currentStudioRole: 'owner' })
  })
})

// ------------------------------------------------------------

describe('Validation du formulaire de création', () => {
  it('refuse un titre trop court et une logline vide', () => {
    const result = validateNewProject({ title: 'A', logline: '', format: 'feature', genre: 'drama' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.title).toBeDefined()
      expect(result.errors.logline).toBeDefined()
    }
  })

  it('accepte une saisie complète et normalise les champs optionnels', () => {
    const result = validateNewProject(PROJECT_A)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.title).toBe('Projet A')
      expect(result.data.audience).toBe('')
    }
  })
})

describe('Slug unique', () => {
  it('dérive le slug du titre', () => {
    expect(uniqueSlug('Le Déluge', [])).toBe('le-deluge')
  })

  it('suffixe en cas de doublon', () => {
    expect(uniqueSlug('Projet A', ['projet-a'])).toBe('projet-a-2')
    expect(uniqueSlug('Projet A', ['projet-a', 'projet-a-2'])).toBe('projet-a-3')
  })

  it('retombe sur un slug lisible si le titre n’en produit aucun', () => {
    expect(uniqueSlug('!!!', [])).toBe('projet')
  })
})

describe('ProjectBootstrapper', () => {
  it('produit un projet complet et déterministe', () => {
    const data = validateNewProject(PROJECT_A)
    expect(data.ok).toBe(true)
    if (!data.ok) return

    const now = '2026-08-04T10:00:00.000Z'
    const project = bootstrapProject(data.data, { existingSlugs: [], now, id: 'proj-test' })

    expect(project.id).toBe('proj-test')
    expect(project.slug).toBe('projet-a')
    expect(project.status).toBe('development')
    expect(project.createdAt).toBe(now)
    expect(project.canon?.logline).toBe(PROJECT_A.logline)
    expect(project.workflow).toHaveLength(WORKFLOW_DEFINITION.length)
    expect(project.completionPercent).toBe(workflowProgress(project.workflow))
    // Collections vides : rien n'est inventé
    expect(project.characters).toEqual([])
    expect(project.loglineHistory).toHaveLength(1)
  })

  it('n’écrit que des décisions factuelles, le reste en hypothèses et questions', () => {
    const data = validateNewProject(PROJECT_A)
    if (!data.ok) throw new Error('saisie invalide')
    const project = bootstrapProject(data.data, { existingSlugs: [] })

    const decisions = project.traces.filter((t) => t.status === 'decision')
    const hypotheses = project.traces.filter((t) => t.status === 'hypothesis')
    const questions = project.traces.filter((t) => t.status === 'open-question')

    expect(decisions).toHaveLength(2)
    // Les décisions ne reprennent que ce que l'humain a choisi
    expect(decisions.every((d) => /Format retenu|Genre retenu/.test(d.content))).toBe(true)
    expect(hypotheses.length).toBeGreaterThanOrEqual(2)
    expect(questions.length).toBeGreaterThanOrEqual(2)
  })
})

// ------------------------------------------------------------

describe('Création réelle et isolation stricte', () => {
  it('crée deux projets avec des slugs distincts', async () => {
    const a = await create(PROJECT_A)
    const b = await create(PROJECT_B)

    expect(a.slug).toBe('projet-a')
    expect(b.slug).toBe('projet-b')
    expect(a.id).not.toBe(b.id)
    expect(store().projects.find((p) => p.slug === 'projet-a')).toBeDefined()
    expect(store().projects.find((p) => p.slug === 'projet-b')).toBeDefined()
  })

  it('donne des slugs uniques à deux projets de même titre', async () => {
    await act(async () => {
      await store().createProject(PROJECT_A)
      await store().createProject(PROJECT_A)
    })
    const slugs = store()
      .projects.filter((p) => p.title === 'Projet A')
      .map((p) => p.slug)
    expect(new Set(slugs).size).toBe(2)
    expect(slugs).toContain('projet-a')
    expect(slugs).toContain('projet-a-2')
  })

  it('ne mélange jamais scènes et plans entre deux projets', async () => {
    const idA = (await create(PROJECT_A)).id
    const idB = (await create(PROJECT_B)).id

    act(() => {
      const seqA = store().addSequence(idA, { title: 'Ouverture A' })
      const seqB = store().addSequence(idB, { title: 'Ouverture B' })
      const sceneA = store().addScene(seqA.id, { title: 'Scène propre à A' })
      const sceneB = store().addScene(seqB.id, { title: 'Scène propre à B' })
      store().addShot(sceneA.id, { notes: 'Plan de A' })
      store().addShot(sceneB.id, { notes: 'Plan de B' })
    })

    const scenesA = store().scenes.filter((s) => s.projectId === idA)
    const scenesB = store().scenes.filter((s) => s.projectId === idB)
    const shotsA = store().shots.filter((s) => s.projectId === idA)
    const shotsB = store().shots.filter((s) => s.projectId === idB)

    expect(scenesA).toHaveLength(1)
    expect(scenesB).toHaveLength(1)
    expect(scenesA[0].title).toBe('Scène propre à A')
    expect(scenesB[0].title).toBe('Scène propre à B')
    expect(shotsA).toHaveLength(1)
    expect(shotsB).toHaveLength(1)
    expect(shotsA[0].notes).toBe('Plan de A')
    expect(shotsB[0].notes).toBe('Plan de B')

    // Aucune scène de A ne référence une séquence de B, et réciproquement
    const seqIdsA = new Set(store().sequences.filter((q) => q.projectId === idA).map((q) => q.id))
    expect(scenesA.every((s) => seqIdsA.has(s.sequenceId))).toBe(true)
    expect(scenesB.every((s) => !seqIdsA.has(s.sequenceId))).toBe(true)
  })

  it('laisse la démonstration Gilgamesh intacte après la création de projets', async () => {
    const before = store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID).length
    const a = await create(PROJECT_A)
    act(() => {
      const seq = store().addSequence(a.id)
      store().addScene(seq.id)
    })
    expect(store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID)).toHaveLength(before)
  })

  it('numérote les scènes et les plans par projet', async () => {
    const a = await create(PROJECT_A)

    act(() => {
      const seq = store().addSequence(a.id)
      const scene = store().addScene(seq.id)
      store().addShot(scene.id)
    })

    const scene = store().scenes.find((s) => s.projectId === a.id)!
    const shot = store().shots.find((s) => s.projectId === a.id)!
    // La démo compte déjà 22 scènes et 13 plans : la numérotation repart à 1
    expect(scene.number).toBe(1)
    expect(shot.number).toBe(1)
  })

  it('refuse de rattacher une scène à une séquence inexistante', () => {
    expect(() => store().addScene('sequence-inexistante')).toThrow(/Séquence introuvable/)
  })
})

// ------------------------------------------------------------

describe('Démonstration Gilgamesh', () => {
  it('est marquée comme démo et porte une version', () => {
    const demo = store().projects.find((p) => p.id === DEMO_PROJECT_ID)!
    expect(demo.isDemo).toBe(true)
    expect(demo.demoVersion).toBe('1.0.0')
    expect(demo.slug).toBe('gilgamesh')
  })

  it('se réinitialise de façon déterministe sans toucher aux autres projets', async () => {
    const a = await create(PROJECT_A)

    act(() => {
      const seq = store().addSequence(a.id, { title: 'Séquence utilisateur' })
      store().addScene(seq.id, { title: 'Scène utilisateur' })
      // On abîme la démo
      const demoScene = store().scenes.find((s) => s.projectId === DEMO_PROJECT_ID)!
      store().updateScene(demoScene.id, { title: 'Titre modifié' })
      store().removeScene(store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID)[1].id)
    })

    const demoCountBefore = store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID).length

    act(() => {
      store().resetDemoProject()
    })

    const demoScenes = store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID)
    expect(demoScenes.length).toBeGreaterThan(demoCountBefore)
    expect(demoScenes.some((s) => s.title === 'Titre modifié')).toBe(false)

    // Le projet utilisateur est intact
    const userScenes = store().scenes.filter((s) => s.projectId === a.id)
    expect(userScenes).toHaveLength(1)
    expect(userScenes[0].title).toBe('Scène utilisateur')
  })

  it('se duplique en projet personnel, sans partager d’identifiants', () => {
    let copy: Project | undefined
    act(() => {
      copy = store().duplicateProject(DEMO_PROJECT_ID, 'Ma reprise')
    })
    expect(copy).toBeDefined()
    const duplicated = copy as Project | undefined
    if (!duplicated) return
    const copyId = duplicated.id

    expect(duplicated.isDemo).toBe(false)
    expect(duplicated.slug).toBe('ma-reprise')
    expect(copyId).not.toBe(DEMO_PROJECT_ID)

    const demoScenes = store().scenes.filter((s) => s.projectId === DEMO_PROJECT_ID)
    const copyScenes = store().scenes.filter((s) => s.projectId === copyId)
    expect(copyScenes).toHaveLength(demoScenes.length)
    // Aucun identifiant de scène partagé entre l'original et la copie
    const demoIds = new Set(demoScenes.map((s) => s.id))
    expect(copyScenes.every((s) => !demoIds.has(s.id))).toBe(true)

    // Modifier la copie ne touche pas la démo
    act(() => {
      store().updateScene(copyScenes[0].id, { title: 'Modifié dans la copie' })
    })
    expect(
      store().scenes.find((s) => s.id === demoScenes[0].id)?.title
    ).not.toBe('Modifié dans la copie')
  })
})

// ------------------------------------------------------------

describe('Moteur de visite guidée', () => {
  it('décrit un parcours complet', () => {
    expect(GILGAMESH_TOUR.id).toBe(DEMO_TOUR_ID)
    expect(GILGAMESH_TOUR.steps.length).toBeGreaterThanOrEqual(10)
    for (const step of GILGAMESH_TOUR.steps) {
      expect(step.title).not.toBe('')
      expect(step.explanation).not.toBe('')
      expect(step.rationale).not.toBe('')
      expect(step.route('gilgamesh')).toMatch(/^\/cinema\/projects\/gilgamesh/)
    }
  })

  it('démarre, avance, recule et retient sa progression', () => {
    const total = GILGAMESH_TOUR.steps.length
    act(() => {
      store().startTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
    })
    expect(store().tour.activeTourId).toBe(DEMO_TOUR_ID)
    expect(store().tour.projectId).toBe(DEMO_PROJECT_ID)
    expect(store().demoIntroDismissed).toBe(true)

    act(() => {
      store().nextTourStep(total)
      store().nextTourStep(total)
    })
    expect(store().tour.stepIndex).toBe(2)

    act(() => {
      store().prevTourStep()
    })
    expect(store().tour.stepIndex).toBe(1)

    // La progression est persistée avec le reste du store
    const persisted = JSON.parse(localStorage.getItem('museion-store-v1') ?? '{}')
    expect(persisted?.state?.tour?.stepIndex).toBe(1)
  })

  it('ne dépasse jamais la dernière étape', () => {
    const total = GILGAMESH_TOUR.steps.length
    act(() => {
      store().startTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
      for (let i = 0; i < total + 5; i++) store().nextTourStep(total)
    })
    expect(store().tour.stepIndex).toBe(total - 1)
  })

  it('peut être ignorée puis rejouée depuis le début', () => {
    act(() => {
      store().startTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
      store().nextTourStep(GILGAMESH_TOUR.steps.length)
      store().skipTour()
    })
    expect(store().tour.activeTourId).toBeNull()
    expect(store().tour.skipped).toBe(true)

    act(() => {
      store().replayTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
    })
    expect(store().tour.activeTourId).toBe(DEMO_TOUR_ID)
    expect(store().tour.stepIndex).toBe(0)
    expect(store().tour.skipped).toBe(false)
  })

  it('marque la visite comme terminée', () => {
    act(() => {
      store().startTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
      store().completeTour()
    })
    expect(store().tour.completedTourIds).toContain(DEMO_TOUR_ID)
    expect(store().tour.activeTourId).toBeNull()
  })

  it('l’introduction ne revient pas une fois écartée', () => {
    expect(store().demoIntroDismissed).toBe(false)
    act(() => {
      store().dismissDemoIntro()
    })
    expect(store().demoIntroDismissed).toBe(true)
  })

  it('ne s’exécute que sur le projet visité', async () => {
    const a = await create(PROJECT_A)
    act(() => {
      store().startTour(DEMO_TOUR_ID, DEMO_PROJECT_ID)
    })
    expect(store().tour.projectId).toBe(DEMO_PROJECT_ID)
    expect(store().tour.projectId).not.toBe(a.id)
  })
})
