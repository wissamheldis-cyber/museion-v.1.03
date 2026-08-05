import { createClient } from '@/lib/supabase/client'
import type { Sequence, StoryboardScene, Shot, StoryboardEdge } from '@/lib/types-storyboard'

function supabase() {
  return createClient()
}

// ============================================================
// Reads
// ============================================================

export async function fetchStoryboard(studioId: string): Promise<{
  sequences: Sequence[]; scenes: StoryboardScene[]; shots: Shot[]; edges: StoryboardEdge[]
}> {
  const results = await Promise.all([
    supabase().from('sequences').select('*').eq('studio_id', studioId).order('order_index', { ascending: true }),
    supabase().from('storyboard_scenes').select('*').eq('studio_id', studioId).order('order_index', { ascending: true }),
    supabase().from('shots').select('*').eq('studio_id', studioId).order('order_index', { ascending: true }),
    supabase().from('storyboard_edges').select('*').eq('studio_id', studioId),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
  const [sequencesRes, scenesRes, shotsRes, edgesRes] = results

  return {
    sequences: (sequencesRes.data ?? []).map(sequenceFromRow),
    scenes: (scenesRes.data ?? []).map(sceneFromRow),
    shots: (shotsRes.data ?? []).map(shotFromRow),
    edges: (edgesRes.data ?? []).map(edgeFromRow),
  }
}

function sequenceFromRow(row: {
  id: string; project_id: string; number: number; title: string; description: string; color: string; order_index: number
}): Sequence {
  return {
    id: row.id, projectId: row.project_id, number: row.number, title: row.title,
    description: row.description, color: row.color, order: row.order_index,
  }
}

function sceneFromRow(row: {
  id: string; sequence_id: string | null; project_id: string; number: number; title: string; location: string
  time_of_day: string; moment: string; emotion: string; intention: string; description: string; lighting: string
  duration_seconds: number; main_shot_type: string | null; asset_id: string | null; order_index: number
  canvas_x: number; canvas_y: number; notes: string
}): StoryboardScene {
  return {
    id: row.id, sequenceId: row.sequence_id ?? '', projectId: row.project_id, number: row.number,
    title: row.title, location: row.location, timeOfDay: row.time_of_day as StoryboardScene['timeOfDay'],
    moment: row.moment as StoryboardScene['moment'], emotion: row.emotion, intention: row.intention,
    description: row.description, lighting: row.lighting, duration: row.duration_seconds,
    mainShotType: (row.main_shot_type as StoryboardScene['mainShotType']) ?? undefined,
    assetId: row.asset_id ?? undefined, order: row.order_index,
    canvasPosition: { x: row.canvas_x, y: row.canvas_y }, notes: row.notes,
  }
}

function shotFromRow(row: {
  id: string; scene_id: string; project_id: string; number: number; type: string; focal: string; camera: string
  sensor: string; ratio: string; movement: string; angle: string; height: string; filter: string
  duration_seconds: number; frame_rate: number; lighting: string; decor: string; continuity: string
  risks: string; reference_notes: string[]; notes: string; asset_id: string | null; order_index: number; validated: boolean
}): Shot {
  return {
    id: row.id, sceneId: row.scene_id, projectId: row.project_id, number: row.number,
    type: row.type as Shot['type'], focal: row.focal, camera: row.camera, sensor: row.sensor, ratio: row.ratio,
    movement: row.movement as Shot['movement'], angle: row.angle, height: row.height, filter: row.filter,
    duration: row.duration_seconds, frameRate: row.frame_rate, lighting: row.lighting, decor: row.decor,
    continuity: row.continuity, risks: row.risks, references: row.reference_notes ?? [], notes: row.notes,
    assetId: row.asset_id ?? undefined, order: row.order_index, validated: row.validated,
  }
}

function edgeFromRow(row: { id: string; source_scene_id: string; target_scene_id: string; type: string; label: string | null }): StoryboardEdge {
  return { id: row.id, source: row.source_scene_id, target: row.target_scene_id, type: row.type as StoryboardEdge['type'], label: row.label ?? undefined }
}

// ============================================================
// Writes
// ============================================================

export async function createSequenceRemote(studioId: string, sequence: Sequence): Promise<void> {
  const { error } = await supabase().from('sequences').insert({
    id: sequence.id, studio_id: studioId, project_id: sequence.projectId, number: sequence.number,
    title: sequence.title, description: sequence.description, color: sequence.color, order_index: sequence.order,
  })
  if (error) throw error
}

export async function updateSequenceRemote(sequenceId: string, patch: Partial<Sequence>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.number !== undefined) row.number = patch.number
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description
  if (patch.color !== undefined) row.color = patch.color
  if (patch.order !== undefined) row.order_index = patch.order
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('sequences').update(row).eq('id', sequenceId)
  if (error) throw error
}

export async function deleteSequenceRemote(sequenceId: string): Promise<void> {
  const { error } = await supabase().from('sequences').delete().eq('id', sequenceId)
  if (error) throw error
}

export async function createSceneRemote(studioId: string, scene: StoryboardScene): Promise<void> {
  const { error } = await supabase().from('storyboard_scenes').insert(sceneToRow(studioId, scene))
  if (error) throw error
}

function sceneToRow(studioId: string, scene: StoryboardScene) {
  return {
    id: scene.id, studio_id: studioId, project_id: scene.projectId, sequence_id: scene.sequenceId || null,
    number: scene.number, title: scene.title, location: scene.location, time_of_day: scene.timeOfDay,
    moment: scene.moment, emotion: scene.emotion, intention: scene.intention, description: scene.description,
    lighting: scene.lighting, duration_seconds: scene.duration, main_shot_type: scene.mainShotType ?? null,
    asset_id: scene.assetId ?? null, order_index: scene.order,
    canvas_x: scene.canvasPosition.x, canvas_y: scene.canvasPosition.y, notes: scene.notes,
  }
}

export async function updateSceneRemote(sceneId: string, patch: Partial<StoryboardScene>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.sequenceId !== undefined) row.sequence_id = patch.sequenceId || null
  if (patch.number !== undefined) row.number = patch.number
  if (patch.title !== undefined) row.title = patch.title
  if (patch.location !== undefined) row.location = patch.location
  if (patch.timeOfDay !== undefined) row.time_of_day = patch.timeOfDay
  if (patch.moment !== undefined) row.moment = patch.moment
  if (patch.emotion !== undefined) row.emotion = patch.emotion
  if (patch.intention !== undefined) row.intention = patch.intention
  if (patch.description !== undefined) row.description = patch.description
  if (patch.lighting !== undefined) row.lighting = patch.lighting
  if (patch.duration !== undefined) row.duration_seconds = patch.duration
  if (patch.mainShotType !== undefined) row.main_shot_type = patch.mainShotType
  if ('assetId' in patch) row.asset_id = patch.assetId || null
  if (patch.order !== undefined) row.order_index = patch.order
  if (patch.canvasPosition !== undefined) {
    row.canvas_x = patch.canvasPosition.x
    row.canvas_y = patch.canvasPosition.y
  }
  if (patch.notes !== undefined) row.notes = patch.notes
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('storyboard_scenes').update(row).eq('id', sceneId)
  if (error) throw error
}

export async function deleteSceneRemote(sceneId: string): Promise<void> {
  const { error } = await supabase().from('storyboard_scenes').delete().eq('id', sceneId)
  if (error) throw error
}

export async function createShotRemote(studioId: string, shot: Shot): Promise<void> {
  const { error } = await supabase().from('shots').insert(shotToRow(studioId, shot))
  if (error) throw error
}

function shotToRow(studioId: string, shot: Shot) {
  return {
    id: shot.id, studio_id: studioId, project_id: shot.projectId, scene_id: shot.sceneId, number: shot.number,
    type: shot.type, focal: shot.focal, camera: shot.camera, sensor: shot.sensor, ratio: shot.ratio,
    movement: shot.movement, angle: shot.angle, height: shot.height, filter: shot.filter,
    duration_seconds: shot.duration, frame_rate: shot.frameRate, lighting: shot.lighting, decor: shot.decor,
    continuity: shot.continuity, risks: shot.risks, reference_notes: shot.references, notes: shot.notes,
    asset_id: shot.assetId ?? null, order_index: shot.order, validated: shot.validated,
  }
}

export async function updateShotRemote(shotId: string, patch: Partial<Shot>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.number !== undefined) row.number = patch.number
  if (patch.type !== undefined) row.type = patch.type
  if (patch.focal !== undefined) row.focal = patch.focal
  if (patch.camera !== undefined) row.camera = patch.camera
  if (patch.sensor !== undefined) row.sensor = patch.sensor
  if (patch.ratio !== undefined) row.ratio = patch.ratio
  if (patch.movement !== undefined) row.movement = patch.movement
  if (patch.angle !== undefined) row.angle = patch.angle
  if (patch.height !== undefined) row.height = patch.height
  if (patch.filter !== undefined) row.filter = patch.filter
  if (patch.duration !== undefined) row.duration_seconds = patch.duration
  if (patch.frameRate !== undefined) row.frame_rate = patch.frameRate
  if (patch.lighting !== undefined) row.lighting = patch.lighting
  if (patch.decor !== undefined) row.decor = patch.decor
  if (patch.continuity !== undefined) row.continuity = patch.continuity
  if (patch.risks !== undefined) row.risks = patch.risks
  if (patch.references !== undefined) row.reference_notes = patch.references
  if (patch.notes !== undefined) row.notes = patch.notes
  if ('assetId' in patch) row.asset_id = patch.assetId || null
  if (patch.order !== undefined) row.order_index = patch.order
  if (patch.validated !== undefined) row.validated = patch.validated
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('shots').update(row).eq('id', shotId)
  if (error) throw error
}

export async function deleteShotRemote(shotId: string): Promise<void> {
  const { error } = await supabase().from('shots').delete().eq('id', shotId)
  if (error) throw error
}

export async function createEdgeRemote(studioId: string, projectId: string, edge: StoryboardEdge): Promise<void> {
  const { error } = await supabase().from('storyboard_edges').insert({
    id: edge.id, studio_id: studioId, project_id: projectId,
    source_scene_id: edge.source, target_scene_id: edge.target, type: edge.type, label: edge.label ?? null,
  })
  if (error) throw error
}

export async function deleteEdgeRemote(edgeId: string): Promise<void> {
  const { error } = await supabase().from('storyboard_edges').delete().eq('id', edgeId)
  if (error) throw error
}
