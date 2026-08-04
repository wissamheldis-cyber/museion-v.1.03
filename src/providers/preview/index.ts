export type { PreviewProvider, PreviewRequest } from './PreviewProvider'
export { SIMULATION_DISCLAIMER } from './PreviewProvider'
export { mockPreviewProvider, MOCK_MODEL_NAME } from './MockPreviewProvider'
export {
  comfyUIPreviewProviderContract,
  buildComfyUIContract,
  COMFYUI_INACTIVE_MESSAGE,
  type ComfyUIWorkflowContract,
} from './ComfyUIPreviewProviderContract'
export { buildMockSvg, svgToDataUri, buildMockPreviewDataUri, classifyScenery } from './mockSvg'
export type { MockSceneSpec, SceneryKind } from './mockSvg'

import { mockPreviewProvider } from './MockPreviewProvider'
import { comfyUIPreviewProviderContract } from './ComfyUIPreviewProviderContract'
import type { PreviewProvider } from './PreviewProvider'

/** Registre des fournisseurs. Un seul est actif en Sprint 2. */
export const PREVIEW_PROVIDERS: PreviewProvider[] = [
  mockPreviewProvider,
  comfyUIPreviewProviderContract,
]

/** Fournisseur actif : toujours le mock local tant qu'aucune autorisation explicite n'existe. */
export const activePreviewProvider: PreviewProvider = mockPreviewProvider
