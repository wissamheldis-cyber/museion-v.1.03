'use client'

import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Archive, ChevronDown, ChevronRight, Search } from 'lucide-react'
import type { Asset } from '@/lib/types-storyboard'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { ASSET_STATUS_LABELS, daysRemaining } from '@/lib/assetLifecycle'
import { cn } from '@/lib/utils'

interface AssetGroup {
  id: string
  label: string
  match: (asset: Asset) => boolean
}

const GROUPS: AssetGroup[] = [
  { id: 'temporary', label: 'Images temporaires', match: (a) => a.status === 'ephemeral' },
  { id: 'references', label: 'Références', match: (a) => a.type === 'reference' },
  { id: 'characters', label: 'Personnages', match: (a) => a.type === 'character' },
  { id: 'decors', label: 'Décors', match: (a) => a.type === 'decor' },
  {
    id: 'approved',
    label: 'Images validées',
    match: (a) => a.type === 'image' && (a.status === 'approved' || a.status === 'canonical'),
  },
]

interface AssetBinProps {
  assets: Asset[]
  onOpenArchives: () => void
}

export function AssetBin({ assets, onOpenArchives }: AssetBinProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const visible = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.status !== 'deleted' &&
          asset.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [assets, query]
  )

  const temporaryCount = assets.filter((a) => a.status === 'ephemeral').length

  return (
    <div className="flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border-subtle)] px-3 py-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Bac d’assets</h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
          Glissez un asset sur une scène du canvas.
        </p>
        <div className="relative mt-2">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un asset…"
            aria-label="Rechercher un asset"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-base)] py-1.5 pl-7 pr-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--interactive)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {GROUPS.map((group) => {
          const items = visible.filter(group.match)
          if (items.length === 0) return null
          const isCollapsed = collapsed[group.id]

          return (
            <section key={group.id} className="mb-2">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((state) => ({ ...state, [group.id]: !state[group.id] }))
                }
                aria-expanded={!isCollapsed}
                className="flex w-full items-center gap-1 rounded px-1 py-1 label-caps transition-colors hover:text-[var(--text-secondary)]"
              >
                {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                {group.label}
                <span className="ml-auto normal-case tracking-normal">{items.length}</span>
              </button>

              {!isCollapsed && (
                <ul className="mt-1 space-y-1">
                  {items.map((asset) => (
                    <li key={asset.id}>
                      <DraggableAsset asset={asset} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="border-t border-[var(--border-subtle)] p-2">
        <button
          type="button"
          onClick={onOpenArchives}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <Archive size={13} />
          Archives temporaires
          {temporaryCount > 0 && (
            <span className="ml-auto rounded-full bg-[var(--accent-champagne-dim)] px-1.5 text-[10px] text-[var(--accent-champagne)]">
              {temporaryCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

function DraggableAsset({ asset }: { asset: Asset }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `asset:${asset.id}`,
    data: { type: 'asset', assetId: asset.id },
  })

  const remaining = asset.status === 'ephemeral' ? daysRemaining(asset) : null

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={`Asset ${asset.name}, statut ${ASSET_STATUS_LABELS[asset.status]}`}
      title={asset.prompt ?? asset.name}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-[var(--radius-sm)] border border-transparent p-1 transition-colors hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]',
        isDragging && 'opacity-40'
      )}
    >
      <PreviewFrame
        url={asset.url}
        alt={asset.name}
        className="h-8 w-[52px] shrink-0 overflow-hidden rounded-[3px]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-[var(--text-primary)]">{asset.name}</p>
        <p
          className={cn(
            'text-[10px]',
            asset.status === 'ephemeral'
              ? 'text-[var(--accent-champagne)]'
              : 'text-[var(--text-muted)]'
          )}
        >
          {ASSET_STATUS_LABELS[asset.status]}
          {remaining !== null && Number.isFinite(remaining) ? ` · ${remaining} j` : ''}
        </p>
      </div>
    </div>
  )
}
