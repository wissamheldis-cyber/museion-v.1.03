'use client'

import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'
import { GILGAMESH_TOUR } from '@/lib/tour/gilgameshTour'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface StageOverviewProps {
  project: Project
  title: string
  /** Rôle de l'étape dans la chaîne de production. */
  role: string
  inputs: string[]
  outputs: string[]
  dependencies: string[]
  /** Ce qui existe réellement aujourd'hui, sans embellissement. */
  availableToday: string[]
  /** Étape correspondante du parcours guidé, si elle existe. */
  tourStepId?: string
  sprint?: 2 | 3
}

/**
 * État contextualisé d'une étape non construite : ce qu'elle fera, avec
 * quoi, pour produire quoi, et ce qui est réellement disponible.
 * Aucune fonction n'est simulée.
 */
export function StageOverview({
  project,
  title,
  role,
  inputs,
  outputs,
  dependencies,
  availableToday,
  tourStepId,
  sprint,
}: StageOverviewProps) {
  const startTour = useMuseionStore((s) => s.startTour)
  const goToTourStep = useMuseionStore((s) => s.goToTourStep)

  const stepIndex = tourStepId
    ? GILGAMESH_TOUR.steps.findIndex((s) => s.id === tourStepId)
    : -1

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-3xl">
        <p className="label-caps">
          {sprint ? `Étape prévue — Sprint ${sprint}` : 'Étape non planifiée'} · {project.title}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{role}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="Entrées attendues" items={inputs} />
          <Panel title="Sorties produites" items={outputs} />
          <Panel title="Dépendances" items={dependencies} />
          <Panel title="Disponible aujourd’hui" items={availableToday} tone="strong" />
        </div>

        {project.isDemo && stepIndex >= 0 && (
          <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
              <Compass size={13} className="text-[var(--text-muted)]" />
              Cette étape est expliquée dans la démonstration guidée
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              Le parcours détaille ce que cette étape recevra et produira, sans rien simuler.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                startTour(GILGAMESH_TOUR.id, project.id)
                goToTourStep(stepIndex)
              }}
            >
              Voir cette étape dans la visite
              <ArrowRight size={12} />
            </Button>
          </div>
        )}

        <Link
          href={`/cinema/projects/${project.slug}`}
          className="mt-8 inline-block text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          ← Retour au projet
        </Link>
      </div>
    </div>
  )
}

function Panel({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone?: 'strong'
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <h2 className="label-caps label-caps-strong">{title}</h2>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`flex gap-2 text-[12px] leading-relaxed ${
              tone === 'strong' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
