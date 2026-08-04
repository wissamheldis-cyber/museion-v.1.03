// ============================================================
// MUSEION — Contrat de fournisseur de prévisualisation
// Aucun fournisseur réel n'est branché en Sprint 2.
// ============================================================

import type { AssetStatus, PreviewResult, ShotType } from '@/lib/types-storyboard'

export interface PreviewRequest {
  /** Sujet principal du plan (personnage, objet, action) */
  subject: string
  /** Lieu tel qu'il est écrit dans la scène */
  location: string
  /** Intention de mise en scène */
  intention: string
  /** Type de plan validé */
  shotType: ShotType
  /** Recette de lumière (identifiant ou description libre) */
  lighting: string
  /** Scène ou plan d'origine, pour la traçabilité */
  sceneId?: string
  shotId?: string
  projectId: string
  /** Intérieur explicite si la scène le précise */
  interior?: boolean
  /** Graine optionnelle pour forcer une variante */
  seed?: string
}

export interface PreviewProvider {
  /** Identifiant technique du fournisseur */
  readonly id: string
  /** Nom affiché dans l'interface */
  readonly label: string
  /** Modèle simulé ou réel annoncé */
  readonly model: string
  /** true tant qu'aucune génération réelle n'est effectuée */
  readonly isSimulation: boolean
  /** Un fournisseur inactif ne doit jamais être appelé */
  readonly isActive: boolean
  /** Statut attribué aux résultats produits */
  readonly producedStatus: AssetStatus
  /** Génère une prévisualisation. Doit rester local en Sprint 2. */
  generate(request: PreviewRequest): Promise<PreviewResult>
}

export const SIMULATION_DISCLAIMER = 'Simulation locale — aucune IA appelée.'
