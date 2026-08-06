// ============================================================
// MUSEION — Pont ComfyUI : relais de l'image générée
// ComfyUI est protégé par Cloudflare Access ; un <img src=...>
// du navigateur ne peut pas porter les en-têtes du secret. Cette
// route va chercher l'image côté serveur et la retransmet.
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

  const filename = req.nextUrl.searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ error: 'Paramètre "filename" requis.' }, { status: 400 })
  }
  const subfolder = req.nextUrl.searchParams.get('subfolder') ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? 'output'

  const upstreamUrl = new URL(`${bridgeUrl}/view`)
  upstreamUrl.searchParams.set('filename', filename)
  upstreamUrl.searchParams.set('subfolder', subfolder)
  upstreamUrl.searchParams.set('type', type)

  try {
    const res = await fetch(upstreamUrl.toString(), {
      headers: bridgeHeaders(),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: `ComfyUI a répondu ${res.status} en tentant de récupérer l'image.` },
        { status: 502 }
      )
    }

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Impossible de contacter le pont ComfyUI : ${message}` },
      { status: 502 }
    )
  }
}
