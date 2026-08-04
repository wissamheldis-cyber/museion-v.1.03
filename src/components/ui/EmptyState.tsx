import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface EmptyStateProps {
  title: string
  role: string
  inputs: string[]
  outputs: string[]
  dependencies?: string[]
  nextAction?: string
  onNextAction?: () => void
}

export function EmptyState({ title, role, inputs, outputs, dependencies, nextAction, onNextAction }: EmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 shadow-lg flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border-subtle)] mb-2">
            <AlertCircle className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <h2 className="text-xl font-medium text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {role}
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-subtle)]">
          <div>
            <span className="label-caps block mb-1">Entrées attendues</span>
            <ul className="list-disc list-inside text-[var(--text-secondary)]">
              {inputs.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>
          <div>
            <span className="label-caps block mb-1">Sorties produites</span>
            <ul className="list-disc list-inside text-[var(--text-secondary)]">
              {outputs.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>
          {dependencies && dependencies.length > 0 && (
            <div>
              <span className="label-caps block mb-1">Dépendances</span>
              <ul className="list-disc list-inside text-[var(--text-muted)]">
                {dependencies.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          )}
        </div>

        {nextAction && onNextAction && (
          <Button onClick={onNextAction} className="w-full">
            {nextAction}
          </Button>
        )}
      </div>
    </div>
  )
}
