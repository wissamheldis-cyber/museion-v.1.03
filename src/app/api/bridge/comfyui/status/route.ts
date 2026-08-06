// ============================================================
// MUSEION — Pont ComfyUI : suivi d'un job soumis
// Interroge /history/{promptId} et rapporte pending/done/error.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

function bridgeHeaders(): HeadersInit {
  const clientId = process.env.CF_ACCESS_CLIENT_ID
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET
  return {
    ...(clientId && clientSecret
      ? { 'CF-Access-Client-Id': clientId, 'CF-Access-Client-Secret': clientSecret }
      : {}),
  }
}

interface ComfyImageRef {
  filename: string
  subfolder: string
  type: string
}

export async function GET(req: NextRequest) {
  const bridgeUrl = process.env.COMFYUI_BRIDGE_URL
  const clientId = process.env.CF_ACCESS_CLIENT_ID
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET

  if (!bridgeUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pont ComfyUI non configuré (variables d'environnement manquantes côté serveur)." },
      { status: 503 }
    )
  }

  const promptId = req.nextUrl.searchParams.get('promptId')
  if (!promptId) {
    return NextResponse.json({ error: 'Paramètre "promptId" requis.' }, { status: 400 })
  }

  try {
    const res = await fetch(`${bridgeUrl}/history/${encodeURIComponent(promptId)}`, {
      headers: bridgeHeaders(),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `ComfyUI a répondu ${res.status}.` }, { status: 502 })
    }

    const data = await res.json()
    const entry = data?.[promptId]

    if (!entry) {
      return NextResponse.json({ status: 'pending' })
    }

    const messages: unknown[] = entry.status?.messages ?? []
    const hasExecutionError = messages.some(
      (m) => Array.isArray(m) && m[0] === 'execution_error'
    )
    if (hasExecutionError) {
      return NextResponse.json({
        status: 'error',
        error: 'ComfyUI a signalé une erreur durant la génération (execution_error).',
      })
    }

    const images = entry.outputs?.['9']?.images as ComfyImageRef[] | undefined
    const image = images?.[0]

    if (!image) {
      return NextResponse.json({ status: 'pending' })
    }

    return NextResponse.json({
      status: 'done',
      filename: image.filename,
      subfolder: image.subfolder,
      type: image.type,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Impossible de contacter le pont ComfyUI : ${message}` },
      { status: 502 }
    )
  }
}
