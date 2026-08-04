// ============================================================
// MUSEION — Workflow de création
// Colonne vertébrale d'un projet, identique pour tous les projets.
// ============================================================

import type { WorkflowStep, WorkflowStepId, WorkflowStepStatus } from '@/lib/types'

export const WORKFLOW_DEFINITION: { id: WorkflowStepId; label: string }[] = [
  { id: 'idea', label: 'Idée' },
  { id: 'script', label: 'Scénario' },
  { id: 'bible', label: 'Bible du projet' },
  { id: 'characters', label: 'Personnages' },
  { id: 'storyboard', label: 'Storyboard' },
  { id: 'previs', label: 'Prévis' },
  { id: 'plans', label: 'Plans & caméra' },
  { id: 'production', label: 'Production' },
  { id: 'review', label: 'Review' },
  { id: 'delivery', label: 'Livrables' },
]

/** Workflow neuf : toutes les étapes à faire. Déterministe. */
export function createWorkflow(
  statuses: Partial<Record<WorkflowStepId, WorkflowStepStatus>> = {}
): WorkflowStep[] {
  return WORKFLOW_DEFINITION.map((step, index) => ({
    id: step.id,
    label: step.label,
    order: index,
    status: statuses[step.id] ?? 'todo',
  }))
}

/** Progression déduite du workflow : une étape en cours compte pour moitié. */
export function workflowProgress(workflow: WorkflowStep[]): number {
  if (workflow.length === 0) return 0
  const score = workflow.reduce((sum, step) => {
    if (step.status === 'done') return sum + 1
    if (step.status === 'in-progress') return sum + 0.5
    return sum
  }, 0)
  return Math.round((score / workflow.length) * 100)
}

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStepStatus, string> = {
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminé',
}
