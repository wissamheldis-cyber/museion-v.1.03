// ============================================================
// MUSEION — Pont LM Studio
// Seul endroit du serveur autorisé à détenir le secret Cloudflare
// Access et à parler au LM Studio local (via le tunnel Cloudflare).
// Ne jamais exposer ces variables au client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LMStudioModel {
  id: string
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

async function pickDefaultModel(bridgeUrl: string): Promise<string> {
  const res = await fetch(`${bridgeUrl}/v1/models`, { headers: bridgeHeaders() })
  if (!res.ok) throw new Error(`LM Studio /v1/models a répondu ${res.status}`)
  const data: { data?: LMStudioModel[] } = await res.json()
  const chatModel = (data.data ?? []).find((m) => !m.id.includes('embedding'))
  if (!chatModel) throw new Error('Aucun modèle de complétion chargé dans LM Studio.')
  return chatModel.id
}

export async function POST(req: NextRequest) {
  const bridgeUrl = process.env.LMSTUDIO_BRIDGE_URL
  const clientId = process.env.CF_ACCESS_CLIENT_ID
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET

  if (!bridgeUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pont LM Studio non configuré (variables d'environnement manquantes côté serveur)." },
      { status: 503 }
    )
  }

  let body: { messages?: ChatMessage[]; model?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  if (!body.messages || body.messages.length === 0) {
    return NextResponse.json({ error: 'Le champ "messages" est requis.' }, { status: 400 })
  }

  try {
    const model = body.model ?? (await pickDefaultModel(bridgeUrl))

    const completionRes = await fetch(`${bridgeUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: bridgeHeaders(),
      // Museion sert des modèles "raisonneurs" (Qwen3.x, GPT-OSS) qui consomment
      // une partie du budget en réflexion interne avant la réponse finale : un
      // max_tokens trop bas coupe la génération avant que le contenu n'apparaisse.
      body: JSON.stringify({ model, messages: body.messages, max_tokens: 4096 }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!completionRes.ok) {
      const text = await completionRes.text().catch(() => '')
      return NextResponse.json(
        { error: `LM Studio a répondu ${completionRes.status}.`, detail: text.slice(0, 500) },
        { status: 502 }
      )
    }

    const data = await completionRes.json()
    const content = data?.choices?.[0]?.message?.content
    const finishReason = data?.choices?.[0]?.finish_reason

    if (typeof content !== 'string' || content.length === 0) {
      const reason =
        finishReason === 'length'
          ? "le modèle a épuisé son budget de tokens en réflexion interne avant de produire une réponse finale — réessayez ou raccourcissez la demande."
          : `raison de fin : ${finishReason ?? 'inconnue'}.`
      return NextResponse.json(
        { error: `Réponse LM Studio vide (${reason})` },
        { status: 502 }
      )
    }

    return NextResponse.json({ content, model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Impossible de contacter le pont LM Studio : ${message}` },
      { status: 502 }
    )
  }
}
