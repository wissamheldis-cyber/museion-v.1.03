'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, MoreHorizontal, Trash2, CircleCheck, Circle } from 'lucide-react'
import type { Asset, Sequence, Shot, StoryboardScene } from '@/lib/types-storyboard'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { SHOT_TYPE_LABELS, CAMERA_MOVEMENT_LABELS } from '@/knowledge/camera'
import { getLightingRecipe } from '@/knowledge/lighting'
import { shotThumbUrl } from '@/components/storyboard/sceneVisual'
import { cn } from '@/lib/utils'

interface ShotCardProps {
  shot: Shot
  scene: StoryboardScene | undefined
  sequence: Sequence | undefined
  assets: Asset[]
  selected: boolean
  onSelect: () => void
  onToggleValidated: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function ShotCard({
  shot,
  scene,
  sequence,
  assets,
  selected,
  onSelect,
  onToggleValidated,
  onDuplicate,
  onDelete,
}: ShotCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as globalThis.Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [menuOpen])

  const lighting = getLightingRecipe(shot.lighting)

  return (
    <article
      className={cn(
        'flex flex-col rounded-[var(--radius-md)] border bg-[var(--bg-card)] transition-colors duration-[var(--transition-fast)]',
        selected
          ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/40'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
      )}
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left text-base font-medium text-[var(--text-primary)] focus-visible:outline-none"
        >
          Plan {String(shot.number).padStart(2, '0')}
        </button>

        {sequence && (
          <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
            Séq. {String(sequence.number).padStart(2, '0')}
          </span>
        )}

        <button
          type="button"
          onClick={onToggleValidated}
          aria-pressed={shot.validated}
          aria-label={shot.validated ? 'Retirer la validation du plan' : 'Valider le plan'}
          title={shot.validated ? 'Plan validé — cliquer pour annuler' : 'Valider le plan'}
          className={cn(
            'shrink-0 rounded-full p-0.5 transition-colors',
            shot.validated
              ? 'text-green-400 hover:text-green-300'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          {shot.validated ? <CircleCheck size={16} /> : <Circle size={16} />}
        </button>
      </header>

      <button type="button" onClick={onSelect} className="px-3 focus-visible:outline-none">
        <PreviewFrame
          url={shotThumbUrl(shot, scene, assets)}
          alt={`Prévisualisation du plan ${shot.number}`}
          className="aspect-video w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
        />
      </button>

      <dl className="mt-3 px-3 pb-1 text-xs">
        <Row label="Type de plan" value={SHOT_TYPE_LABELS[shot.type]} />
        <Row label="Focale" value={shot.focal} />
        <Row label="Mouvement caméra" value={CAMERA_MOVEMENT_LABELS[shot.movement]} />
        <Row label="Durée" value={`${shot.duration.toString().replace('.', ',')} s`} />
        <Row label="Lumière" value={lighting?.name ?? shot.lighting} />
        <Row label="Décor" value={shot.decor} />
        <Row label="Continuité" value={shot.continuity} last />
      </dl>

      <div className="relative flex justify-center py-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={`Actions du plan ${shot.number}`}
          title="Actions du plan"
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <div className="absolute bottom-9 z-20 w-48 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-xl">
            <MenuItem
              icon={Check}
              label={shot.validated ? 'Annuler la validation' : 'Valider le plan'}
              onClick={() => {
                setMenuOpen(false)
                onToggleValidated()
              }}
            />
            <MenuItem
              icon={Copy}
              label="Dupliquer le plan"
              onClick={() => {
                setMenuOpen(false)
                onDuplicate()
              }}
            />
            <MenuItem
              icon={Trash2}
              label="Supprimer le plan"
              destructive
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
            />
          </div>
        )}
      </div>
    </article>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-1.5',
        !last && 'border-b border-[var(--border-subtle)]'
      )}
    >
      <dt className="shrink-0 text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate text-right text-[var(--text-primary)]">{value}</dd>
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
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
