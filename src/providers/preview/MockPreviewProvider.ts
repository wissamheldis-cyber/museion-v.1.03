// ============================================================
// MUSEION — MockPreviewProvider
// Génère une composition SVG locale et déterministe.
// Aucun appel réseau, aucun modèle réel, aucune clé.
// ============================================================

import type { PreviewResult } from '@/lib/types-storyboard'
import { generateId } from '@/lib/utils'
import { buildMockSvg, svgToDataUri } from './mockSvg'
import {
  SIMULATION_DISCLAIMER,
  type PreviewProvider,
  type PreviewRequest,
} from './PreviewProvider'

export const MOCK_MODEL_NAME = 'museion-mock-compositor-v1'

class MockPreviewProviderImpl implements PreviewProvider {
  readonly id = 'mock'
  readonly label = 'Compositeur local Museion'
  readonly model = MOCK_MODEL_NAME
  readonly isSimulation = true
  readonly isActive = true
  readonly producedStatus = 'ephemeral' as const

  async generate(request: PreviewRequest): Promise<PreviewResult> {
    return this.generateSync(request)
  }

  /**
   * Version synchrone utilisée par les données de démonstration et les tests.
   * Le résultat est strictement déterministe pour une même requête.
   */
  generateSync(request: PreviewRequest): PreviewResult {
    const svg = buildMockSvg({
      subject: request.subject,
      location: request.location,
      intention: request.intention,
      shotType: request.shotType,
      lighting: request.lighting,
      interior: request.interior,
      seed: request.seed,
    })

    return {
      id: request.seed ? `preview-${request.seed}` : generateId(),
      status: this.producedStatus,
      url: svgToDataUri(svg),
      prompt: describeRequest(request),
      simulatedModel: this.model,
      generatedAt: new Date().toISOString(),
      isSimulation: true,
      disclaimer: SIMULATION_DISCLAIMER,
    }
  }
}

function describeRequest(request: PreviewRequest): string {
  return [
    request.subject,
    request.location,
    request.intention,
    request.shotType,
    request.lighting,
  ]
    .filter(Boolean)
    .join(' — ')
}

export const mockPreviewProvider = new MockPreviewProviderImpl()
