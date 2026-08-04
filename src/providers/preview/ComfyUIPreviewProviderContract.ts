// ============================================================
// MUSEION — Contrat ComfyUI (INACTIF)
// Ce fichier ne contient AUCUNE implémentation réseau.
// Il décrit la charge utile qui sera envoyée le jour où un
// workflow ComfyUI sera explicitement autorisé par l'humain.
// ============================================================

import type { PreviewResult } from '@/lib/types-storyboard'
import type { PreviewProvider, PreviewRequest } from './PreviewProvider'

/**
 * Forme du JSON attendu par un futur workflow ComfyUI.
 * Aucune requête n'est émise en Sprint 2 : la charge utile
 * est uniquement construite, affichée et journalisée localement.
 */
export interface ComfyUIWorkflowContract {
  contractVersion: '1.0'
  workflow: string
  clientId: string
  inputs: {
    positivePrompt: string
    negativePrompt: string
    width: number
    height: number
    steps: number
    cfg: number
    sampler: string
    scheduler: string
    seed: number
    checkpoint: string
  }
  metadata: {
    projectId: string
    sceneId?: string
    shotId?: string
    shotType: string
    lighting: string
    composedFrom: 'museion-prompt-composer'
  }
}

export const COMFYUI_DEFAULT_NEGATIVE =
  'flou, artefacts, texte, filigrane, anachronisme, déformation anatomique'

/**
 * Construit la charge utile sans jamais l'envoyer.
 */
export function buildComfyUIContract(
  request: PreviewRequest,
  positivePrompt: string,
  seed = 0
): ComfyUIWorkflowContract {
  return {
    contractVersion: '1.0',
    workflow: 'museion/storyboard-preview',
    clientId: 'museion-local',
    inputs: {
      positivePrompt,
      negativePrompt: COMFYUI_DEFAULT_NEGATIVE,
      width: 1280,
      height: 720,
      steps: 24,
      cfg: 4.5,
      sampler: 'dpmpp_2m',
      scheduler: 'karras',
      seed,
      checkpoint: 'à définir lors de l’autorisation explicite',
    },
    metadata: {
      projectId: request.projectId,
      sceneId: request.sceneId,
      shotId: request.shotId,
      shotType: request.shotType,
      lighting: request.lighting,
      composedFrom: 'museion-prompt-composer',
    },
  }
}

export const COMFYUI_INACTIVE_MESSAGE =
  'Fournisseur ComfyUI inactif — aucun appel réseau autorisé en V1.'

/**
 * Fournisseur volontairement inactif : toute tentative d'appel lève.
 * Il existe pour figer l'interface, pas pour être utilisé.
 */
export const comfyUIPreviewProviderContract: PreviewProvider = {
  id: 'comfyui',
  label: 'ComfyUI (contrat, inactif)',
  model: 'non défini',
  isSimulation: false,
  isActive: false,
  producedStatus: 'ephemeral',
  async generate(): Promise<PreviewResult> {
    throw new Error(COMFYUI_INACTIVE_MESSAGE)
  },
}
