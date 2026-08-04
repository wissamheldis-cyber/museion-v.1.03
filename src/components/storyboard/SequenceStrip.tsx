'use client'

import type { Asset, Sequence, StoryboardScene } from '@/lib/types-storyboard'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { cn } from '@/lib/utils'
import { sceneThumbUrl } from './sceneVisual'

interface SequenceStripProps {
  sequences: Sequence[]
  scenes: StoryboardScene[]
  assets: Asset[]
  activeSequenceId: string
  onSelect: (sequenceId: string) => void
}

export function SequenceStrip({
  sequences,
  scenes,
  assets,
  activeSequenceId,
  onSelect,
}: SequenceStripProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Séquences du projet"
    >
      {sequences.map((sequence) => {
        const sequenceScenes = scenes
          .filter((s) => s.sequenceId === sequence.id)
          .sort((a, b) => a.order - b.order)
        const active = sequence.id === activeSequenceId
        const cover = sequenceScenes[0]

        return (
          <button
            key={sequence.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(sequence.id)}
            title={sequence.description}
            className={cn(
              'flex min-w-[140px] flex-1 items-center gap-2 rounded-[var(--radius-md)] border p-2 text-left transition-colors duration-[var(--transition-fast)]',
              active
                ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-dim)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
            )}
          >
            {cover ? (
              <PreviewFrame
                url={sceneThumbUrl(cover, assets)}
                alt={`Séquence ${sequence.number} — ${sequence.title}`}
                className="h-10 w-[54px] shrink-0 overflow-hidden rounded-[var(--radius-sm)]"
              />
            ) : (
              <div className="h-10 w-[54px] shrink-0 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: sequence.color }}
                />
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  Séq. {String(sequence.number).padStart(2, '0')}
                </p>
              </div>
              <p className="truncate text-[11px] text-[var(--text-secondary)]">{sequence.title}</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {sequenceScenes.length} scène{sequenceScenes.length > 1 ? 's' : ''}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
