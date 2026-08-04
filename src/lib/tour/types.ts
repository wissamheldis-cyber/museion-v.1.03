// ============================================================
// MUSEION — Moteur de visite guidée : contrat d'une étape
// Réutilisable pour n'importe quel projet de démonstration.
// ============================================================

export type DemoAnimation = 'fade' | 'rise' | 'draw' | 'count' | 'none'

export interface DemoStep {
  id: string
  /** Route cible, construite depuis le slug du projet visité. */
  route: (slug: string) => string
  /** Sélecteur CSS de l'élément mis en avant. Absent = étape centrée. */
  target?: string
  title: string
  /** Ce que l'on voit. */
  explanation: string
  /** Pourquoi cette étape existe dans un vrai travail de production. */
  rationale: string
  /** Ce que l'utilisateur peut faire ici, décrit sans être déclenché. */
  action?: string
  /** Libellé du bouton d'avancement, si différent de « Suivant ». */
  nextLabel?: string
  /** Animation d'apparition de l'encart. */
  animation?: DemoAnimation
  /** Données de démonstration révélées à cette étape, s'il y en a. */
  reveal?: string
  /** Condition à remplir pour valider l'étape, évaluée sur le DOM. */
  validate?: () => boolean
}

export interface DemoTour {
  id: string
  label: string
  description: string
  steps: DemoStep[]
}
