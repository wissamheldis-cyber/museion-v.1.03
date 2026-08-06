export type { PreviewProvider, PreviewRequest } from './PreviewProvider'
export { SIMULATION_DISCLAIMER } from './PreviewProvider'
export { mockPreviewProvider, MOCK_MODEL_NAME } from './MockPreviewProvider'
export {
  comfyUIPreviewProviderContract,
  buildComfyUIContract,
  COMFYUI_INACTIVE_MESSAGE,
  type ComfyUIWorkflowContract,
} from './ComfyUIPreviewProviderContract'
export { comfyUIPreviewProvider } from './ComfyUIPreviewProvider'
export { buildMockSvg, svgToDataUri, buildMockPreviewDataUri, classifyScenery } from './mockSvg'
export type { MockSceneSpec, SceneryKind } from './mockSvg'

import { mockPreviewProvider } from './MockPreviewProvider'
import { comfyUIPreviewProvider } from './ComfyUIPreviewProvider'
import type { PreviewProvider } from './PreviewProvider'

/** Registre des fournisseurs. */
export const PREVIEW_PROVIDERS: PreviewProvider[] = [mockPreviewProvider, comfyUIPreviewProvider]

/**
 * Fournisseur actif : ComfyUI réel. Checkpoint sd_xl_base_1.0.safetensors installé
 * et testé de bout en bout le 2026-08-06 (génération directe API ComfyUI confirmée).
 * En cas de souci, revenir à mockPreviewProvider ici.
 */
export const activePreviewProvider: PreviewProvider = comfyUIPreviewProvider
