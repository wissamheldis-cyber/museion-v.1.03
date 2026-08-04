import { createClient } from '@/lib/supabase/client'
import type {
  Project, Synopsis, Treatment, ProjectVision, ArtisticDossier, Character,
  ScriptScene, LoglineVersion, TraceItem, WorkflowStep,
} from '@/lib/types'

function supabase() {
  return createClient()
}

// ============================================================
// Row <-> V1 shape mapping
// ============================================================

interface ProjectRow {
  id: string; slug: string; title: string; status: string; format: string; genre: string
  cover_image_url: string | null; is_favorite: boolean; completion_percent: number
  is_demo: boolean; is_archived: boolean; demo_version: string | null
  created_at: string; updated_at: string
}

interface CanonRow {
  project_id: string; logline: string
  synopsis_short: string; synopsis_long: string; synopsis_beginning: string
  synopsis_development: string; synopsis_resolution: string
  treatment: Treatment | null; vision: ProjectVision | null
  artistic_dossier: ArtisticDossier | null; workflow: WorkflowStep[]
}

function synopsisFromCanon(row: CanonRow): Synopsis {
  return {
    short: row.synopsis_short, long: row.synopsis_long, beginning: row.synopsis_beginning,
    development: row.synopsis_development, resolution: row.synopsis_resolution,
  }
}

function assembleProject(
  row: ProjectRow,
  canon: CanonRow | undefined,
  loglineHistory: LoglineVersion[],
  characters: Character[],
  scriptScenes: ScriptScene[],
  traces: TraceItem[],
): Project {
  const synopsis = canon ? synopsisFromCanon(canon) : undefined
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as Project['status'],
    format: row.format as Project['format'],
    genre: row.genre as Project['genre'],
    logline: canon?.logline ?? '',
    loglineHistory,
    vision: canon?.vision ?? undefined,
    synopsis,
    treatment: canon?.treatment ?? undefined,
    script: scriptScenes.length > 0 ? { scenes: scriptScenes } : undefined,
    characters,
    artisticDossier: canon?.artistic_dossier ?? undefined,
    canon: canon ? { logline: canon.logline, synopsis } : undefined,
    workflow: canon?.workflow ?? [],
    traces,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    isDemo: row.is_demo,
    demoVersion: row.demo_version ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    completionPercent: row.completion_percent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSavedAt: row.updated_at,
  }
}

function traceFromRow(
  status: 'decision' | 'hypothesis' | 'open-question',
  row: { id: string; project_id: string; content: string; created_at: string; context?: string; to_validate?: string; priority?: string },
): TraceItem {
  const base = { id: row.id, projectId: row.project_id, content: row.content, date: row.created_at }
  if (status === 'decision') return { ...base, status, context: row.context ?? undefined }
  if (status === 'hypothesis') return { ...base, status, toValidate: row.to_validate ?? undefined }
  return { ...base, status, priority: (row.priority ?? 'medium') as 'low' | 'medium' | 'high' }
}

// ============================================================
// Reads
// ============================================================

export async function fetchProjects(studioId: string): Promise<Project[]> {
  const [projectsRes, canonRes, loglineRes, charactersRes, scriptRes, decisionsRes, hypothesesRes, questionsRes] =
    await Promise.all([
      supabase().from('projects').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }),
      supabase().from('project_canon').select('*').eq('studio_id', studioId),
      supabase().from('logline_versions').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }),
      supabase().from('characters').select('*').eq('studio_id', studioId),
      supabase().from('script_scenes').select('*').eq('studio_id', studioId).order('order_index', { ascending: true }),
      supabase().from('decisions').select('*').eq('studio_id', studioId),
      supabase().from('hypotheses').select('*').eq('studio_id', studioId),
      supabase().from('open_questions').select('*').eq('studio_id', studioId),
    ])

  const projects = (projectsRes.data ?? []) as ProjectRow[]
  const canonByProject = new Map<string, CanonRow>((canonRes.data ?? []).map((c) => [c.project_id, c as CanonRow]))

  const loglineByProject = groupBy(loglineRes.data ?? [])
  const charactersByProject = groupBy(charactersRes.data ?? [])
  const scriptByProject = groupBy(scriptRes.data ?? [])

  const traceByProject = new Map<string, TraceItem[]>()
  for (const row of decisionsRes.data ?? []) pushTrace(traceByProject, row.project_id, traceFromRow('decision', row))
  for (const row of hypothesesRes.data ?? []) pushTrace(traceByProject, row.project_id, traceFromRow('hypothesis', row))
  for (const row of questionsRes.data ?? []) pushTrace(traceByProject, row.project_id, traceFromRow('open-question', row))

  return projects.map((row) =>
    assembleProject(
      row,
      canonByProject.get(row.id),
      (loglineByProject.get(row.id) ?? []).map(loglineFromRow),
      (charactersByProject.get(row.id) ?? []).map(characterFromRow),
      (scriptByProject.get(row.id) ?? []).map(scriptSceneFromRow),
      traceByProject.get(row.id) ?? [],
    )
  )
}

function groupBy<T extends { project_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.project_id) ?? []
    list.push(row)
    map.set(row.project_id, list)
  }
  return map
}

function pushTrace(map: Map<string, TraceItem[]>, projectId: string, trace: TraceItem) {
  const list = map.get(projectId) ?? []
  list.push(trace)
  map.set(projectId, list)
}

function loglineFromRow(row: { id: string; content: string; word_count: number; label: string | null; created_at: string }): LoglineVersion {
  return { id: row.id, content: row.content, wordCount: row.word_count, savedAt: row.created_at, label: row.label ?? undefined }
}

function characterFromRow(row: {
  id: string; name: string; role: string; actor: string | null; objective: string; inner_need: string
  contradiction: string; arc: string; relations: unknown; appearance: string; costume: string
  continuity_notes: string; reference_assets: unknown; image_url: string | null
}): Character {
  return {
    id: row.id, name: row.name, role: row.role, actor: row.actor ?? undefined, objective: row.objective,
    innerNeed: row.inner_need, contradiction: row.contradiction, arc: row.arc,
    relations: (row.relations as Character['relations']) ?? [],
    appearance: row.appearance, costume: row.costume, continuityNotes: row.continuity_notes,
    references: (row.reference_assets as Character['references']) ?? [], imageUrl: row.image_url ?? undefined,
  }
}

function scriptSceneFromRow(row: {
  id: string; number: number; title: string; location: string; time_of_day: string; blocks: unknown; order_index: number
}): ScriptScene {
  return {
    id: row.id, number: row.number, title: row.title, location: row.location,
    timeOfDay: row.time_of_day as ScriptScene['timeOfDay'], blocks: (row.blocks as ScriptScene['blocks']) ?? [],
    order: row.order_index,
  }
}

// ============================================================
// Writes
// ============================================================

export async function createProjectRemote(studioId: string, project: Project): Promise<void> {
  const { error } = await supabase().from('projects').insert({
    id: project.id,
    studio_id: studioId,
    slug: project.slug,
    title: project.title,
    status: project.status,
    format: project.format,
    genre: project.genre,
    cover_image_url: project.coverImageUrl ?? null,
    is_favorite: project.isFavorite,
    is_archived: project.isArchived,
    is_demo: project.isDemo ?? false,
    demo_version: project.demoVersion ?? null,
    completion_percent: project.completionPercent,
  })
  if (error) throw error

  await supabase().from('project_canon').insert({
    studio_id: studioId,
    project_id: project.id,
    logline: project.logline,
    synopsis_short: project.synopsis?.short ?? '',
    synopsis_long: project.synopsis?.long ?? '',
    synopsis_beginning: project.synopsis?.beginning ?? '',
    synopsis_development: project.synopsis?.development ?? '',
    synopsis_resolution: project.synopsis?.resolution ?? '',
    treatment: project.treatment ?? null,
    vision: project.vision ?? null,
    artistic_dossier: project.artisticDossier ?? null,
    workflow: project.workflow,
  })
}

export async function deleteProjectRemote(projectId: string): Promise<void> {
  const { error } = await supabase().from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function updateProjectCoreRemote(projectId: string, patch: Partial<Project>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.slug !== undefined) row.slug = patch.slug
  if (patch.title !== undefined) row.title = patch.title
  if (patch.status !== undefined) row.status = patch.status
  if (patch.format !== undefined) row.format = patch.format
  if (patch.genre !== undefined) row.genre = patch.genre
  if (patch.coverImageUrl !== undefined) row.cover_image_url = patch.coverImageUrl
  if (patch.isFavorite !== undefined) row.is_favorite = patch.isFavorite
  if (patch.isArchived !== undefined) row.is_archived = patch.isArchived
  if (patch.completionPercent !== undefined) row.completion_percent = patch.completionPercent
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('projects').update(row).eq('id', projectId)
  if (error) throw error
}

export async function upsertProjectCanonRemote(
  studioId: string,
  projectId: string,
  patch: {
    logline?: string; synopsis?: Partial<Synopsis>; treatment?: Treatment; vision?: ProjectVision
    artisticDossier?: ArtisticDossier; workflow?: WorkflowStep[]
  }
): Promise<void> {
  const row: Record<string, unknown> = { studio_id: studioId, project_id: projectId }
  if (patch.logline !== undefined) row.logline = patch.logline
  if (patch.synopsis?.short !== undefined) row.synopsis_short = patch.synopsis.short
  if (patch.synopsis?.long !== undefined) row.synopsis_long = patch.synopsis.long
  if (patch.synopsis?.beginning !== undefined) row.synopsis_beginning = patch.synopsis.beginning
  if (patch.synopsis?.development !== undefined) row.synopsis_development = patch.synopsis.development
  if (patch.synopsis?.resolution !== undefined) row.synopsis_resolution = patch.synopsis.resolution
  if (patch.treatment !== undefined) row.treatment = patch.treatment
  if (patch.vision !== undefined) row.vision = patch.vision
  if (patch.artisticDossier !== undefined) row.artistic_dossier = patch.artisticDossier
  if (patch.workflow !== undefined) row.workflow = patch.workflow

  const { error } = await supabase().from('project_canon').upsert(row, { onConflict: 'project_id' })
  if (error) throw error
}

export async function addLoglineVersionRemote(studioId: string, projectId: string, version: LoglineVersion): Promise<void> {
  const { error } = await supabase().from('logline_versions').insert({
    id: version.id, studio_id: studioId, project_id: projectId,
    content: version.content, word_count: version.wordCount, label: version.label ?? null,
  })
  if (error) throw error
}

export async function upsertCharacterRemote(studioId: string, projectId: string, character: Character): Promise<void> {
  const { error } = await supabase().from('characters').upsert({
    id: character.id, studio_id: studioId, project_id: projectId,
    name: character.name, role: character.role, actor: character.actor ?? null,
    objective: character.objective, inner_need: character.innerNeed, contradiction: character.contradiction,
    arc: character.arc, relations: character.relations, appearance: character.appearance,
    costume: character.costume, continuity_notes: character.continuityNotes,
    reference_assets: character.references, image_url: character.imageUrl ?? null,
  })
  if (error) throw error
}

export async function deleteCharacterRemote(characterId: string): Promise<void> {
  const { error } = await supabase().from('characters').delete().eq('id', characterId)
  if (error) throw error
}

export async function replaceScriptScenesRemote(studioId: string, projectId: string, scenes: ScriptScene[]): Promise<void> {
  // The script editor rewrites the whole scene list per save (matches the
  // existing updateScript(projectId, scenes) action signature).
  const { error: deleteError } = await supabase().from('script_scenes').delete().eq('project_id', projectId)
  if (deleteError) throw deleteError
  if (scenes.length === 0) return
  const { error } = await supabase().from('script_scenes').insert(
    scenes.map((scene) => ({
      id: scene.id, studio_id: studioId, project_id: projectId,
      number: scene.number, title: scene.title, location: scene.location,
      time_of_day: scene.timeOfDay, blocks: scene.blocks, order_index: scene.order,
    }))
  )
  if (error) throw error
}

export async function addTraceRemote(studioId: string, trace: TraceItem): Promise<void> {
  const table = trace.status === 'decision' ? 'decisions' : trace.status === 'hypothesis' ? 'hypotheses' : 'open_questions'
  const row: Record<string, unknown> = {
    id: trace.id, studio_id: studioId, project_id: trace.projectId, content: trace.content,
  }
  if (trace.status === 'decision') row.context = trace.context ?? null
  if (trace.status === 'hypothesis') row.to_validate = trace.toValidate ?? null
  if (trace.status === 'open-question') row.priority = trace.priority
  const { error } = await supabase().from(table).insert(row)
  if (error) throw error
}
