import { fetchProjects, createProjectRemote, addLoglineVersionRemote, upsertCharacterRemote, replaceScriptScenesRemote, addTraceRemote } from './projects'
import { fetchStoryboard, createSequenceRemote, createSceneRemote, createShotRemote, createEdgeRemote } from './storyboard'
import { fetchAssets, createAssetRemote } from './assets'
import { fetchSprint4 } from './sprint4'
import { DEMO_PROJECTS } from '@/lib/demo-data'
import {
  DEMO_SEQUENCES, DEMO_SCENES_WITH_ASSETS, DEMO_SHOTS, DEMO_STORYBOARD_EDGES, DEMO_ASSETS,
} from '@/lib/demo-storyboard'
import type { Project } from '@/lib/types'
import type { Asset, Sequence, StoryboardScene, Shot, StoryboardEdge } from '@/lib/types-storyboard'

/** Everything museionStore.initV2 needs to populate the live app in one shot. */
export async function fetchWorkspace(studioId: string) {
  const [projects, storyboard, assetData, sprint4] = await Promise.all([
    fetchProjects(studioId),
    fetchStoryboard(studioId),
    fetchAssets(studioId),
    fetchSprint4(studioId),
  ])

  return {
    projects,
    sequences: storyboard.sequences,
    scenes: storyboard.scenes,
    shots: storyboard.shots,
    edges: storyboard.edges,
    assets: assetData.assets,
    assetJournal: assetData.journal,
    ...sprint4,
  }
}

/** Seul projet de démo conservé pour les studios non-admin (fait office de tuto). */
const GILGAMESH_PROJECT_ID = 'proj-gilgamesh'

/**
 * A freshly created studio has no data. Seed it with demo projects so the
 * guided tour and demo walkthrough keep working out of the box once auth is
 * real. The admin studio (illimité, project_limit null) gets the full demo
 * catalog ; tout autre studio ne reçoit que Gilgamesh, qui sert de tutoriel.
 *
 * The static fixtures use human-readable ids ("proj-gilgamesh", "seq-01",
 * "shot-001"...) — every Postgres primary key here is `uuid`, so every id
 * and cross-reference is remapped to a fresh UUID before insertion.
 */
export async function bootstrapDemoData(
  studioId: string,
  options?: { fullCatalog?: boolean }
): Promise<void> {
  const demoProjects = options?.fullCatalog
    ? DEMO_PROJECTS
    : DEMO_PROJECTS.filter((p) => p.id === GILGAMESH_PROJECT_ID)
  const retainedProjectIds = new Set(demoProjects.map((p) => p.id))

  const demoSequences = DEMO_SEQUENCES.filter((s) => retainedProjectIds.has(s.projectId))
  const demoScenes = DEMO_SCENES_WITH_ASSETS.filter((s) => retainedProjectIds.has(s.projectId))
  const demoShots = DEMO_SHOTS.filter((s) => retainedProjectIds.has(s.projectId))
  const retainedSceneIds = new Set(demoScenes.map((s) => s.id))
  const demoEdges = DEMO_STORYBOARD_EDGES.filter(
    (e) => retainedSceneIds.has(e.source) && retainedSceneIds.has(e.target)
  )
  const demoAssets = DEMO_ASSETS.filter((a) => retainedProjectIds.has(a.projectId))

  const projectIds = new Map(demoProjects.map((p) => [p.id, crypto.randomUUID()]))
  const assetIds = new Map(demoAssets.map((a) => [a.id, crypto.randomUUID()]))
  const sequenceIds = new Map(demoSequences.map((s) => [s.id, crypto.randomUUID()]))
  const sceneIds = new Map(demoScenes.map((s) => [s.id, crypto.randomUUID()]))
  const shotIds = new Map(demoShots.map((s) => [s.id, crypto.randomUUID()]))

  const remappedProjects: Project[] = demoProjects.map((project) => ({
    ...project,
    id: projectIds.get(project.id)!,
    loglineHistory: project.loglineHistory.map((v) => ({ ...v, id: crypto.randomUUID() })),
    characters: project.characters.map((c) => ({ ...c, id: crypto.randomUUID() })),
    script: project.script
      ? { ...project.script, scenes: project.script.scenes.map((s) => ({ ...s, id: crypto.randomUUID() })) }
      : project.script,
    traces: project.traces.map((t) => ({ ...t, id: crypto.randomUUID(), projectId: projectIds.get(project.id)! })),
  }))

  for (const project of remappedProjects) {
    // Le contenu de démo ne doit jamais consommer le quota de projets réels
    // du compte — il n'est pas créé par l'utilisateur.
    await createProjectRemote(studioId, project, { countsTowardLimit: false })
    for (const version of project.loglineHistory) {
      await addLoglineVersionRemote(studioId, project.id, version)
    }
    for (const character of project.characters) {
      await upsertCharacterRemote(studioId, project.id, character)
    }
    if (project.script) {
      await replaceScriptScenesRemote(studioId, project.id, project.script.scenes)
    }
    for (const trace of project.traces) {
      await addTraceRemote(studioId, trace)
    }
  }

  const remappedAssets: Asset[] = demoAssets.map((asset) => ({
    ...asset,
    id: assetIds.get(asset.id)!,
    projectId: projectIds.get(asset.projectId) ?? asset.projectId,
    sceneId: asset.sceneId ? sceneIds.get(asset.sceneId) : undefined,
    sequenceId: asset.sequenceId ? sequenceIds.get(asset.sequenceId) : undefined,
  }))
  for (const asset of remappedAssets) {
    await createAssetRemote(studioId, asset)
  }

  const remappedSequences: Sequence[] = demoSequences.map((sequence) => ({
    ...sequence,
    id: sequenceIds.get(sequence.id)!,
    projectId: projectIds.get(sequence.projectId) ?? sequence.projectId,
  }))
  for (const sequence of remappedSequences) {
    await createSequenceRemote(studioId, sequence)
  }

  const remappedScenes: StoryboardScene[] = demoScenes.map((scene) => ({
    ...scene,
    id: sceneIds.get(scene.id)!,
    projectId: projectIds.get(scene.projectId) ?? scene.projectId,
    sequenceId: sequenceIds.get(scene.sequenceId) ?? scene.sequenceId,
    assetId: scene.assetId ? assetIds.get(scene.assetId) : undefined,
  }))
  for (const scene of remappedScenes) {
    await createSceneRemote(studioId, scene)
  }

  const remappedShots: Shot[] = demoShots.map((shot) => ({
    ...shot,
    id: shotIds.get(shot.id)!,
    projectId: projectIds.get(shot.projectId) ?? shot.projectId,
    sceneId: sceneIds.get(shot.sceneId) ?? shot.sceneId,
    assetId: shot.assetId ? assetIds.get(shot.assetId) : undefined,
  }))
  for (const shot of remappedShots) {
    await createShotRemote(studioId, shot)
  }

  const projectIdByScene = new Map(demoScenes.map((scene) => [scene.id, scene.projectId]))
  const remappedEdges: { edge: StoryboardEdge; projectId: string }[] = demoEdges.map((edge) => ({
    edge: {
      ...edge,
      id: crypto.randomUUID(),
      source: sceneIds.get(edge.source) ?? edge.source,
      target: sceneIds.get(edge.target) ?? edge.target,
    },
    projectId: projectIds.get(projectIdByScene.get(edge.source) ?? demoProjects[0].id) ?? demoProjects[0].id,
  }))
  for (const { edge, projectId } of remappedEdges) {
    await createEdgeRemote(studioId, projectId, edge)
  }
}
