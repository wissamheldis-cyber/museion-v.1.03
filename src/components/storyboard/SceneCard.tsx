'use client'

import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Copy, Trash2, ArrowRightLeft, GripVertical } from 'lucide-react'
import type { Asset, Sequence, StoryboardScene } from '@/lib/types-storyboard'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { cn } from '@/lib/utils'
import { formatTimecode, sceneThumbUrl } from './sceneVisual'

interface SceneCardProps {
  scene: StoryboardScene
  assets: Asset[]
  sequences: Sequence[]
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveToSequence: (sequenceId: string) => void
}

export function SceneCard({
  scene,
  assets,
  sequences,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveToSequence,
}: SceneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: scene.id, data: { type: 'scene', sequenceId: scene.sequenceId } })
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as globalThis.Node)) {
        setMenuOpen(false)
        setMoveOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [menuOpen])

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative rounded-[var(--radius-md)] border bg-[var(--bg-card)] transition-colors duration-[var(--transition-fast)]',
        selected
          ? 'border-[var(--interactive)] ring-1 ring-[var(--interactive)]/40'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
        isDragging && 'opacity-50',
        isOver && !isDragging && 'border-[var(--accent-champagne)]'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Sélectionner la scène ${scene.number} — ${scene.title}`}
        className="block w-full text-left focus-visible:outline-none"
      >
        <PreviewFrame
          url={sceneThumbUrl(scene, assets)}
          alt={`Miniature de la scène ${scene.number} — ${scene.title}`}
          className="aspect-video rounded-t-[var(--radius-md)] overflow-hidden"
        >
          <span className="absolute left-2 top-2 rounded-[var(--radius-sm)] bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-primary)]">
            {String(scene.number).padStart(2, '0')}
          </span>
        </PreviewFrame>

        <div className="px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{scene.title}</p>
            <span className="shrink-0 text-xs metric text-[var(--text-muted)]">
              {formatTimecode(scene.duration)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="text-[var(--interactive)]">Intention</span> : {scene.intention}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-[var(--text-muted)]">
            {scene.timeOfDay} · {scene.moment} · {scene.location}
          </p>
        </div>
      </button>

      {/* Poignée de déplacement */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Déplacer la scène ${scene.number}`}
        title="Déplacer la scène"
        className="absolute left-2 top-9 cursor-grab rounded bg-black/60 p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-[var(--text-primary)] focus-visible:opacity-100 group-hover:opacity-100"
      >
        <GripVertical size={13} />
      </button>

      {/* Menu contextuel */}
      <div className="absolute right-2 top-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`Actions de la scène ${scene.number}`}
          aria-expanded={menuOpen}
          title="Actions de la scène"
          className="rounded bg-black/70 p-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 z-20 w-52 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-xl">
            <MenuItem
              icon={Copy}
              label="Dupliquer la scène"
              onClick={() => {
                setMenuOpen(false)
                onDuplicate()
              }}
            />
            <MenuItem
              icon={ArrowRightLeft}
              label="Changer de séquence"
              onClick={() => setMoveOpen((open) => !open)}
            />
            {moveOpen && (
              <div className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1">
                {sequences.map((sequence) => (
                  <button
                    key={sequence.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setMoveOpen(false)
                      onMoveToSequence(sequence.id)
                    }}
                    disabled={sequence.id === scene.sequenceId}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] disabled:opacity-40"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: sequence.color }}
                    />
                    Séq. {String(sequence.number).padStart(2, '0')} — {sequence.title}
                  </button>
                ))}
              </div>
            )}
            <MenuItem
              icon={Trash2}
              label="Supprimer la scène"
              destructive
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
        destructive
          ? 'text-[var(--state-danger)] hover:bg-[var(--state-danger-dim)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
