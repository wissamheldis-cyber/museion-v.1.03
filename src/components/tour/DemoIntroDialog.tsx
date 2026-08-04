'use client'

import { useEffect } from 'react'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMuseionStore } from '@/store/museionStore'
import { GILGAMESH_TOUR } from '@/lib/tour/gilgameshTour'
import type { Project } from '@/lib/types'

/**
 * Fenêtre d'introduction affichée à la première ouverture d'un projet de
 * démonstration. Le choix est mémorisé : elle ne revient pas à chaque visite.
 */
export function DemoIntroDialog({ project }: { project: Project }) {
  const dismissed = useMuseionStore((s) => s.demoIntroDismissed)
  const tour = useMuseionStore((s) => s.tour)
  const dismissDemoIntro = useMuseionStore((s) => s.dismissDemoIntro)
  const startTour = useMuseionStore((s) => s.startTour)

  const open = Boolean(project.isDemo) && !dismissed && !tour.activeTourId

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissDemoIntro()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, dismissDemoIntro])

  if (!open) return null

  return (
    <div
      className="overlay-scrim fixed inset-0 z-[90] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Introduction à la démonstration"
    >
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-2xl tour-rise">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-[var(--text-secondary)]" />
          <p className="label-caps label-caps-strong">Démo guidée</p>
        </div>

        <h2 className="mt-3 text-xl font-medium text-[var(--text-primary)]">
          {project.title} est un projet de démonstration
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {project.title} est un projet de démonstration conçu pour vous faire découvrir Museion.
          Les données, scènes, plans et prévisualisations présentés ici sont des exemples guidés et
          peuvent être réinitialisés à tout moment.
        </p>

        <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
          La visite ne modifie que ce projet. Vos projets personnels ne sont jamais touchés, aucun
          travail de génération n’est lancé et aucune API n’est appelée.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => startTour(GILGAMESH_TOUR.id, project.id)}>
            Démarrer la visite
          </Button>
          <Button variant="secondary" onClick={dismissDemoIntro}>
            Explorer librement
          </Button>
          <button
            type="button"
            onClick={dismissDemoIntro}
            className="ml-auto self-center text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Ne plus afficher cette introduction
          </button>
        </div>
      </div>
    </div>
  )
}
