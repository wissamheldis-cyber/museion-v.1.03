import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetJournalEntry } from '@/lib/types-storyboard'

function supabase() {
  return createClient()
}

export async function fetchAssets(studioId: string): Promise<{ assets: Asset[]; journal: AssetJournalEntry[] }> {
  const results = await Promise.all([
    supabase().from('assets').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }),
    supabase().from('asset_versions').select('*').eq('studio_id', studioId),
    supabase().from('asset_relations').select('*').eq('studio_id', studioId),
    supabase().from('asset_journal_entries').select('*').eq('studio_id', studioId).order('decided_at', { ascending: false }).limit(200),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
  const [assetsRes, versionsRes, relationsRes, journalRes] = results

  const versionsByAsset = new Map<string, unknown[]>()
  for (const row of versionsRes.data ?? []) {
    const list = versionsByAsset.get(row.asset_id) ?? []
    list.push(versionFromRow(row))
    versionsByAsset.set(row.asset_id, list)
  }
  const relationsByAsset = new Map<string, unknown[]>()
  for (const row of relationsRes.data ?? []) {
    const list = relationsByAsset.get(row.asset_id) ?? []
    list.push(relationFromRow(row))
    relationsByAsset.set(row.asset_id, list)
  }

  const assets = (assetsRes.data ?? []).map((row) =>
    assetFromRow(row, (versionsByAsset.get(row.id) ?? []) as Asset['versions'], (relationsByAsset.get(row.id) ?? []) as Asset['relations'])
  )
  const journal = (journalRes.data ?? []).map(journalFromRow)

  return { assets, journal }
}

function versionFromRow(row: { id: string; url: string; prompt: string | null; created_at: string; status: string }) {
  return { id: row.id, url: row.url, prompt: row.prompt ?? '', createdAt: row.created_at, status: row.status }
}

function relationFromRow(row: { id: string; asset_id: string; related_asset_id: string; type: string }) {
  return { id: row.id, assetId: row.asset_id, relatedAssetId: row.related_asset_id, type: row.type }
}

function assetFromRow(
  row: {
    id: string; project_id: string; name: string; type: string; status: string; url: string
    thumbnail_url: string | null; scene_id: string | null; sequence_id: string | null
    created_at: string; expires_at: string | null; metadata: Record<string, string> | null
  },
  versions: Asset['versions'],
  relations: Asset['relations'],
): Asset {
  const provenance = (row as unknown as { provenance?: { modelId?: string } }).provenance
  return {
    id: row.id, projectId: row.project_id, name: row.name, type: row.type as Asset['type'],
    status: row.status as Asset['status'], url: row.url, thumbnailUrl: row.thumbnail_url ?? undefined,
    simulatedModel: provenance?.modelId, sceneId: row.scene_id ?? undefined, sequenceId: row.sequence_id ?? undefined,
    createdAt: row.created_at, expiresAt: row.expires_at ?? undefined,
    metadata: row.metadata ?? {}, versions, relations,
  }
}

function journalFromRow(row: {
  id: string; asset_id: string; asset_name: string; action: string; from_status: string | null
  to_status: string | null; decided_by: string; decided_at: string; note: string | null
}): AssetJournalEntry {
  return {
    id: row.id, assetId: row.asset_id, assetName: row.asset_name, action: row.action,
    from: (row.from_status as AssetJournalEntry['from']) ?? undefined,
    to: (row.to_status as AssetJournalEntry['to']) ?? undefined,
    decidedBy: row.decided_by, decidedAt: row.decided_at, note: row.note ?? undefined,
  }
}

export async function createAssetRemote(studioId: string, asset: Asset): Promise<void> {
  const { error } = await supabase().from('assets').insert({
    id: asset.id, studio_id: studioId, project_id: asset.projectId, name: asset.name, type: asset.type,
    status: asset.status, url: asset.url, thumbnail_url: asset.thumbnailUrl ?? null,
    scene_id: asset.sceneId ?? null, sequence_id: asset.sequenceId ?? null,
    expires_at: asset.expiresAt ?? null, metadata: asset.metadata,
    provenance: { type: 'human', modelId: asset.simulatedModel },
  })
  if (error) throw error
}

export async function updateAssetRemote(assetId: string, patch: Partial<Asset>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.status !== undefined) row.status = patch.status
  // sceneId/sequenceId/expiresAt are legitimately cleared via `undefined` by
  // callers (detachAssetFromScene, etc.) — use `in` so that case still writes.
  if ('sceneId' in patch) row.scene_id = patch.sceneId ?? null
  if ('sequenceId' in patch) row.sequence_id = patch.sequenceId ?? null
  if ('expiresAt' in patch) row.expires_at = patch.expiresAt ?? null
  if (patch.metadata !== undefined) row.metadata = patch.metadata
  if (Object.keys(row).length === 0) return
  const { error } = await supabase().from('assets').update(row).eq('id', assetId)
  if (error) throw error
}

export async function addAssetVersionRemote(
  studioId: string, projectId: string, assetId: string,
  version: { id: string; url: string; prompt: string; status: string },
): Promise<void> {
  const { error } = await supabase().from('asset_versions').insert({
    id: version.id, studio_id: studioId, project_id: projectId, asset_id: assetId,
    url: version.url, prompt: version.prompt, status: version.status,
  })
  if (error) throw error
}

export async function addJournalEntryRemote(studioId: string, projectId: string, entry: AssetJournalEntry): Promise<void> {
  const { error } = await supabase().from('asset_journal_entries').insert({
    id: entry.id, studio_id: studioId, project_id: projectId, asset_id: entry.assetId,
    asset_name: entry.assetName, action: entry.action, from_status: entry.from ?? null,
    to_status: entry.to ?? null, decided_by: entry.decidedBy, decided_at: entry.decidedAt, note: entry.note ?? null,
  })
  if (error) throw error
}
