'use client'

import { Info, Lightbulb, X } from 'lucide-react'
import type { DemoStep } from '@/lib/tour/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DemoCoachmarkProps {
  step: DemoStep
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
  position: { top: number; left: number } | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onExit: () => void
}

const ANIMATION_CLASS: Record<string, string> = {
  fade: 'tour-fade',
  rise: 'tour-rise',
  draw: 'tour-draw',
  count: 'tour-fade',
  none: '',
}

export function DemoCoachmark({
  step,
  index,
  total,
  isFirst,
  isLast,
  position,
  onNext,
  onPrev,
  onSkip,
  onExit,
}: DemoCoachmarkProps) {
  const percent = Math.round(((index + 1) / total) * 100)

  return (
    <aside
      role="dialog"
      aria-label={`Étape ${index + 1} sur ${total} — ${step.title}`}
      className={cn(
        'fixed z-[80] w-[360px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-[var(--interactive-border)] bg-[var(--bg-card)] p-4 shadow-2xl',
        ANIMATION_CLASS[step.animation ?? 'fade']
      )}
      style={
        position
          ? { top: position.top, left: position.left }
          : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps">
            Étape {index + 1} / {total}
          </p>
          <h2 className="mt-1 text-base font-medium text-[var(--text-primary)]">{step.title}</h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Quitter la démonstration"
          title="Quitter la démonstration"
          className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progression */}
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className="h-full rounded-full bg-[var(--interactive)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{step.explanation}</p>

      <p className="mt-3 flex gap-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
        <Lightbulb size={13} className="mt-0.5 shrink-0" />
        <span>{step.rationale}</span>
      </p>

      {step.action && (
        <p className="mt-2 flex gap-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          <Info size={13} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
          <span>{step.action}</span>
        </p>
      )}

      {step.reveal && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-[11px] text-[var(--text-muted)]">
          {step.reveal}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={isFirst}>
          Précédent
        </Button>
        <Button variant="primary" size="sm" onClick={onNext}>
          {step.nextLabel ?? 'Suivant'}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="ml-auto text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          {isLast ? 'Fermer' : 'Ignorer la visite'}
        </button>
      </div>
    </aside>
  )
}
