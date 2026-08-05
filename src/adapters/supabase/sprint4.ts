import { createClient } from '@/lib/supabase/client'
import type {
  WritingMission, WritingMessage, WritingVariant, ProductionJob, ReviewComment,
  ReviewChecklist, DeliverablePackage, AssetCollection,
} from '@/lib/types-sprint4'

function supabase() {
  return createClient()
}

export async function fetchSprint4(studioId: string) {
  const results = await Promise.all([
    supabase().from('writing_missions').select('*').eq('studio_id', studioId),
    supabase().from('messages').select('*').eq('studio_id', studioId).not('mission_id', 'is', null),
    supabase().from('ai_proposals').select('*').eq('studio_id', studioId),
    supabase().from('generation_jobs').select('*').eq('studio_id', studioId),
    supabase().from('review_comments').select('*').eq('studio_id', studioId),
    supabase().from('review_checklist_items').select('*').eq('studio_id', studioId),
    supabase().from('deliverables').select('*').eq('studio_id', studioId),
    supabase().from('asset_collections').select('*').eq('studio_id', studioId),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
  const [
    missionsRes, messagesRes, proposalsRes, jobsRes, commentsRes, checklistRes, deliverablesRes, collectionsRes,
  ] = results

  return {
    writingMissions: (missionsRes.data ?? []).map(missionFromRow),
    writingMessages: (messagesRes.data ?? []).map(messageFromRow),
    writingVariants: (proposalsRes.data ?? []).map(variantFromRow),
    productionJobs: (jobsRes.data ?? []).map(jobFromRow),
    reviewComments: (commentsRes.data ?? []).map(commentFromRow),
    reviewChecklists: (checklistRes.data ?? []).map(checklistFromRow),
    deliverablePackages: (deliverablesRes.data ?? []).map(deliverableFromRow),
    assetCollections: (collectionsRes.data ?? []).map(collectionFromRow),
  }
}

function missionFromRow(row: { id: string; project_id: string; title: string; target: string; context_snapshot: string; created_at: string }): WritingMission {
  return { id: row.id, projectId: row.project_id, title: row.title, target: row.target as WritingMission['target'], context: row.context_snapshot, createdAt: row.created_at }
}

function messageFromRow(row: { id: string; mission_id: string; role: string; content: string; classification: string | null; created_at: string }): WritingMessage {
  return { id: row.id, missionId: row.mission_id, role: row.role as WritingMessage['role'], content: row.content, classification: (row.classification as WritingMessage['classification']) ?? undefined, createdAt: row.created_at }
}

function variantFromRow(row: { id: string; mission_id: string; label: string; content: string; target: string; selected: boolean; created_at: string }): WritingVariant {
  return { id: row.id, missionId: row.mission_id, label: row.label, content: row.content, target: row.target as WritingVariant['target'], selected: row.selected, createdAt: row.created_at }
}

function jobFromRow(row: {
  id: string; project_id: string; scene_id: string | null; shot_id: string | null; label: string; kind: string
  status: string; prompt: string; parameters: Record<string, string> | null; provider: string
  reference_asset_ids: string[] | null; result_asset_id: string | null; error: string | null
  created_at: string; updated_at: string; started_at: string | null; completed_at: string | null
}): ProductionJob {
  const params = row.parameters ?? {}
  return {
    id: row.id, projectId: row.project_id, sceneId: row.scene_id ?? undefined, shotId: row.shot_id ?? undefined,
    label: row.label, kind: row.kind as ProductionJob['kind'], status: row.status as ProductionJob['status'],
    prompt: row.prompt, ratio: params.ratio ?? '', resolution: params.resolution ?? '', seed: params.seed ?? '',
    quality: (params.quality as ProductionJob['quality']) ?? 'standard', provider: row.provider,
    referenceAssetIds: row.reference_asset_ids ?? [], resultAssetId: row.result_asset_id ?? undefined,
    error: row.error ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at,
    startedAt: row.started_at ?? undefined, completedAt: row.completed_at ?? undefined,
  }
}

function commentFromRow(row: { id: string; project_id: string; asset_id: string; content: string; author_name: string; created_at: string }): ReviewComment {
  return { id: row.id, projectId: row.project_id, assetId: row.asset_id, content: row.content, author: row.author_name, createdAt: row.created_at }
}

function checklistFromRow(row: { id: string; project_id: string; asset_id: string; label: string; checked: boolean }): ReviewChecklist {
  return { id: row.id, projectId: row.project_id, assetId: row.asset_id, label: row.label, checked: row.checked }
}

function deliverableFromRow(row: { id: string; project_id: string; title: string; sections: DeliverablePackage['sections']; created_at: string; exported_at: string | null }): DeliverablePackage {
  return { id: row.id, projectId: row.project_id, title: row.title, sections: row.sections ?? [], createdAt: row.created_at, exportedAt: row.exported_at ?? undefined }
}

function collectionFromRow(row: { id: string; project_id: string; name: string; asset_ids: string[] | null; created_at: string }): AssetCollection {
  return { id: row.id, projectId: row.project_id, name: row.name, assetIds: row.asset_ids ?? [], createdAt: row.created_at }
}

// ============================================================
// Writes
// ============================================================

export async function createMissionRemote(studioId: string, mission: WritingMission): Promise<void> {
  const { error } = await supabase().from('writing_missions').insert({
    id: mission.id, studio_id: studioId, project_id: mission.projectId, title: mission.title,
    target: mission.target, context_snapshot: mission.context, status: 'active',
  })
  if (error) throw error
}

export async function deleteMissionRemote(missionId: string): Promise<void> {
  const { error } = await supabase().from('writing_missions').delete().eq('id', missionId)
  if (error) throw error
}

export async function createMessageRemote(studioId: string, projectId: string, message: WritingMessage): Promise<void> {
  const { error } = await supabase().from('messages').insert({
    id: message.id, studio_id: studioId, project_id: projectId, mission_id: message.missionId,
    role: message.role, content: message.content, classification: message.classification ?? null,
    provenance: { type: message.role === 'assistant' ? 'ai' : 'human' },
  })
  if (error) throw error
}

export async function createVariantRemote(studioId: string, projectId: string, variant: WritingVariant): Promise<void> {
  const { error } = await supabase().from('ai_proposals').insert({
    id: variant.id, studio_id: studioId, project_id: projectId, mission_id: variant.missionId,
    target: variant.target, content: variant.content, label: variant.label, selected: variant.selected,
    status: 'pending', provenance: { type: 'ai' },
  })
  if (error) throw error
}

export async function selectVariantRemote(missionId: string, variantId: string): Promise<void> {
  await supabase().from('ai_proposals').update({ selected: false }).eq('mission_id', missionId)
  const { error } = await supabase().from('ai_proposals').update({ selected: true }).eq('id', variantId)
  if (error) throw error
}

export async function createJobRemote(studioId: string, job: ProductionJob): Promise<void> {
  const { error } = await supabase().from('generation_jobs').insert({
    id: job.id, studio_id: studioId, project_id: job.projectId, label: job.label, kind: job.kind,
    status: job.status, prompt: job.prompt,
    parameters: { ratio: job.ratio, resolution: job.resolution, seed: job.seed, quality: job.quality },
    provider: job.provider, scene_id: job.sceneId ?? null, shot_id: job.shotId ?? null,
    reference_asset_ids: job.referenceAssetIds ?? [], provenance: { type: 'system' },
  })
  if (error) throw error
}

export async function updateJobRemote(jobId: string, patch: Partial<ProductionJob>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.resultAssetId !== undefined) row.result_asset_id = patch.resultAssetId
  if (patch.error !== undefined) row.error = patch.error
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('generation_jobs').update(row).eq('id', jobId)
  if (error) throw error
}

export async function createReviewCommentRemote(studioId: string, comment: ReviewComment): Promise<void> {
  const { error } = await supabase().from('review_comments').insert({
    id: comment.id, studio_id: studioId, project_id: comment.projectId, asset_id: comment.assetId,
    content: comment.content, author_name: comment.author,
  })
  if (error) throw error
}

export async function deleteReviewCommentRemote(commentId: string): Promise<void> {
  const { error } = await supabase().from('review_comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function createChecklistItemRemote(studioId: string, item: ReviewChecklist): Promise<void> {
  const { error } = await supabase().from('review_checklist_items').insert({
    id: item.id, studio_id: studioId, project_id: item.projectId, asset_id: item.assetId,
    label: item.label, checked: item.checked,
  })
  if (error) throw error
}

export async function toggleChecklistItemRemote(itemId: string, checked: boolean): Promise<void> {
  const { error } = await supabase().from('review_checklist_items').update({ checked }).eq('id', itemId)
  if (error) throw error
}

export async function createDeliverableRemote(studioId: string, pack: DeliverablePackage): Promise<void> {
  const { error } = await supabase().from('deliverables').insert({
    id: pack.id, studio_id: studioId, project_id: pack.projectId, title: pack.title,
    format: 'html', sections: pack.sections,
  })
  if (error) throw error
}

export async function updateDeliverableRemote(packageId: string, patch: { sections?: DeliverablePackage['sections']; exportedAt?: string }): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.sections !== undefined) row.sections = patch.sections
  if (patch.exportedAt !== undefined) row.exported_at = patch.exportedAt
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('deliverables').update(row).eq('id', packageId)
  if (error) throw error
}

export async function createAssetCollectionRemote(studioId: string, collection: AssetCollection): Promise<void> {
  const { error } = await supabase().from('asset_collections').insert({
    id: collection.id, studio_id: studioId, project_id: collection.projectId, name: collection.name, asset_ids: collection.assetIds,
  })
  if (error) throw error
}

export async function updateAssetCollectionRemote(collectionId: string, assetIds: string[]): Promise<void> {
  const { error } = await supabase().from('asset_collections').update({ asset_ids: assetIds }).eq('id', collectionId)
  if (error) throw error
}

export async function deleteAssetCollectionRemote(collectionId: string): Promise<void> {
  const { error } = await supabase().from('asset_collections').delete().eq('id', collectionId)
  if (error) throw error
}
