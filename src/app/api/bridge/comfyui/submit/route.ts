// ============================================================
// MUSEION — Pont ComfyUI : soumission d'un workflow
// Construit un graphe ComfyUI standard (checkpoint → CLIP →
// KSampler → VAEDecode → SaveImage) et le soumet via le tunnel.
// Seul endroit du serveur autorisé à détenir le secret Cloudflare
// Access. Ne jamais exposer ces variables au client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

interface SubmitBody {
  positivePrompt?: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  cfg?: number
  sampler?: string
  scheduler?: string
  seed?: number
}

function bridgeHeaders(): HeadersInit {
  const clientId = process.env.CF_ACCESS_CLIENT_ID
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET
  return {
    'Content-Type': 'application/json',
    ...(clientId && clientSecret
      ? { 'CF-Access-Client-Id': clientId, 'CF-Access-Client-Secret': clientSecret }
      : {}),
  }
}

interface GraphInput {
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

/**
 * Graphe ComfyUI minimal standard (nœuds de base, sans extension tierce) :
 * CheckpointLoaderSimple → CLIPTextEncode (x2) → EmptyLatentImage → KSampler
 * → VAEDecode → SaveImage. Les identifiants de nœuds ("3".."9") sont fixes
 * pour pouvoir retrouver l'image de sortie dans /history par la suite.
 */
function buildGraph(input: GraphInput) {
  return {
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: input.checkpoint } },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: { width: input.width, height: input.height, batch_size: 1 },
    },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: input.positivePrompt, clip: ['4', 1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: input.negativePrompt, clip: ['4', 1] } },
    '3': {
      class_type: 'KSampler',
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'museion', images: ['8', 0] } },
  }
}

export async function POST(req: NextRequest) {
  const bridgeUrl = process.env.COMFYUI_BRIDGE_URL
  const clientId = process.env.CF_ACCESS_CLIENT_ID
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET

  if (!bridgeUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pont ComfyUI non configuré (variables d'environnement manquantes côté serveur)." },
      { status: 503 }
    )
  }

  const checkpoint = process.env.COMFYUI_DEFAULT_CHECKPOINT
  if (!checkpoint) {
    return NextResponse.json(
      {
        error:
          'Aucun checkpoint configuré. Installe un modèle dans ComfyUI (models/checkpoints) puis définis COMFYUI_DEFAULT_CHECKPOINT avec son nom de fichier exact.',
      },
      { status: 503 }
    )
  }

  let body: SubmitBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  if (!body.positivePrompt) {
    return NextResponse.json({ error: 'Le champ "positivePrompt" est requis.' }, { status: 400 })
  }

  const input: GraphInput = {
    positivePrompt: body.positivePrompt,
    negativePrompt:
      body.negativePrompt ?? 'flou, artefacts, texte, filigrane, anachronisme, déformation anatomique',
    width: body.width ?? 1280,
    height: body.height ?? 720,
    steps: body.steps ?? 24,
    cfg: body.cfg ?? 4.5,
    sampler: body.sampler ?? 'dpmpp_2m',
    scheduler: body.scheduler ?? 'karras',
    seed: body.seed ?? Math.floor(Math.random() * 1_000_000_000),
    checkpoint,
  }

  try {
    const res = await fetch(`${bridgeUrl}/prompt`, {
      method: 'POST',
      headers: bridgeHeaders(),
      body: JSON.stringify({ prompt: buildGraph(input), client_id: `museion-${Math.random().toString(36).slice(2)}` }),
      signal: AbortSignal.timeout(20_000),
    })

    const data = await res.json().catch(() => ({}))
    const nodeErrors = data?.node_errors as Record<string, unknown> | undefined

    if (!res.ok || (nodeErrors && Object.keys(nodeErrors).length > 0)) {
      return NextResponse.json(
        { error: 'ComfyUI a refusé le workflow.', detail: nodeErrors ?? data?.error ?? null },
        { status: 502 }
      )
    }

    if (!data.prompt_id) {
      return NextResponse.json({ error: "Réponse ComfyUI inattendue (pas de prompt_id)." }, { status: 502 })
    }

    return NextResponse.json({ promptId: data.prompt_id as string })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Impossible de contacter le pont ComfyUI : ${message}` },
      { status: 502 }
    )
  }
}
