'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, Copy, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'
import { GILGAMESH_TOUR } from '@/lib/tour/gilgameshTour'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Project } from '@/lib/types'

/**
 * Bandeau de la démonstration guidée. Toutes ses actions ne touchent
 * que ce projet : aucun projet personnel n'est modifié.
 */
export function DemoProjectPanel({ project }: { project: Project }) {
  const router = useRouter()
  const tour = useMuseionStore((s) => s.tour)
  const startTour = useMuseionStore((s) => s.startTour)
  const replayTour = useMuseionStore((s) => s.replayTour)
  const resetDemoProject = useMuseionStore((s) => s.resetDemoProject)
  const duplicateProject = useMuseionStore((s) => s.duplicateProject)

  const [confirmReset, setConfirmReset] = useState(false)

  const completed = tour.completedTourIds.includes(GILGAMESH_TOUR.id)
  const inProgress = tour.activeTourId === GILGAMESH_TOUR.id
  const started = inProgress || tour.stepIndex > 0 || tour.skipped
  const totalSteps = GILGAMESH_TOUR.steps.length

  const handleDuplicate = () => {
    const copy = duplicateProject(project.id, `${project.title} — mon projet`)
    if (copy) router.push(`/cinema/projects/${copy.slug}`)
  }

  return (
    <section
      data-tour="demo-panel"
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="selected" size="md">
          <Compass size={12} />
          DÉMO GUIDÉE
        </Badge>
        {project.demoVersion && (
          <span className="label-caps">Version {project.demoVersion}</span>
        )}
        {completed && <Badge variant="ok">Visite terminée</Badge>}
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Découvrez le fonctionnement complet de Museion.
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
        {totalSteps} étapes, du développement aux livrables. La visite ne modifie que ce projet,
        ne déclenche aucun travail de génération et n’appelle aucune API.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!started || completed ? (
          <Button variant="primary" size="sm" onClick={() => startTour(GILGAMESH_TOUR.id, project.id)}>
            <Play size={12} />
            Démarrer la démonstration
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => startTour(GILGAMESH_TOUR.id, project.id)}>
            <SkipForward size={12} />
            Reprendre la démonstration
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={() => replayTour(GILGAMESH_TOUR.id, project.id)}>
          <RotateCcw size={12} />
          Rejouer depuis le début
        </Button>

        <Button variant="secondary" size="sm" onClick={handleDuplicate}>
          <Copy size={12} />
          Dupliquer comme projet personnel
        </Button>

        <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
          Réinitialiser {project.title}
        </Button>
      </div>

      {started && !completed && (
        <p className="mt-3 text-[11px] text-[var(--text-muted)]">
          Progression enregistrée : étape {Math.min(tour.stepIndex + 1, totalSteps)} sur {totalSteps}.
        </p>
      )}

      <ConfirmDialog
        open={confirmReset}
        title={`Réinitialiser ${project.title}`}
        message={`Les séquences, scènes, plans, connexions et assets de ${project.title} seront remis dans leur état de démonstration d’origine. Vos autres projets ne sont pas touchés.`}
        confirmLabel="Réinitialiser la démonstration"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoProject()
          setConfirmReset(false)
        }}
      />
    </section>
  )
}
