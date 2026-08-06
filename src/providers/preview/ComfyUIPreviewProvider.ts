// ============================================================
// MUSEION — Fournisseur ComfyUI réel (pont local)
// À la différence de ComfyUIPreviewProviderContract.ts (gelé,
// inactif), ce fichier effectue de vrais appels réseau vers le
// pont ComfyUI. Non branché sur activePreviewProvider tant qu'un
// checkpoint réel n'a pas permis un test de bout en bout — voir
// providers/preview/index.ts.
// ============================================================

import type { PreviewResult } from '@/lib/types-storyboard'
import type { PreviewProvider, PreviewRequest } from './PreviewProvider'
import { COMFYUI_DEFAULT_NEGATIVE } from './ComfyUIPreviewProviderContract'
import { generateId } from '@/lib/utils'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60 // ~3 minutes

interface ComfyImageRef {
  filename: string
  subfolder: string
  type: string
}

function composePrompt(request: PreviewRequest): string {
  return [request.subject, request.location, request.intention, request.lighting]
    .filter(Boolean)
    .join(', ')
}

async function submitJob(request: PreviewRequest): Promise<string> {
  const res = await fetch('/api/bridge/comfyui/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      positivePrompt: composePrompt(request),
      negativePrompt: COMFYUI_DEFAULT_NEGATIVE,
      width: 1280,
      height: 720,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Le pont ComfyUI a répondu ${res.status}.`)
  return data.promptId as string
}

async function pollUntilDone(promptId: string): Promise<ComfyImageRef> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const res = await fetch(`/api/bridge/comfyui/status?promptId=${encodeURIComponent(promptId)}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? `Le pont ComfyUI a répondu ${res.status}.`)
    if (data.status === 'done') return data as ComfyImageRef
    if (data.status === 'error') throw new Error(data.error ?? 'ComfyUI a signalé une erreur.')
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('Délai dépassé en attendant la génération ComfyUI (3 minutes).')
}

export const comfyUIPreviewProvider: PreviewProvider = {
  id: 'comfyui-real',
  label: 'ComfyUI (pont local)',
  model: 'checkpoint configuré côté serveur (COMFYUI_DEFAULT_CHECKPOINT)',
  isSimulation: false,
  isActive: true,
  producedStatus: 'ephemeral',

  async generate(request: PreviewRequest): Promise<PreviewResult> {
    const promptId = await submitJob(request)
    const image = await pollUntilDone(promptId)
    const url = `/api/bridge/comfyui/image?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder)}&type=${encodeURIComponent(image.type)}`

    return {
      id: generateId(),
      status: 'ephemeral',
      url,
      prompt: composePrompt(request),
      simulatedModel: 'ComfyUI (pont local)',
      generatedAt: new Date().toISOString(),
      isSimulation: false,
      disclaimer: 'Génération réelle via ComfyUI local — vérifier le résultat avant validation.',
    }
  },
}
