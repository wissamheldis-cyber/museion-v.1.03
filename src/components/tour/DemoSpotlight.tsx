'use client'

/**
 * Halo de mise en avant. Ne capte aucun clic : l'interface reste utilisable
 * pendant la visite.
 */
export function DemoSpotlight({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[70] bg-black/45 tour-fade"
        aria-hidden="true"
      />
    )
  }

  const pad = 8
  const top = Math.max(0, rect.top - pad)
  const left = Math.max(0, rect.left - pad)
  const width = rect.width + pad * 2
  const height = rect.height + pad * 2

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true">
      <div
        className="absolute rounded-[var(--radius-md)] tour-spotlight"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          border: '1px solid var(--interactive-border)',
        }}
      />
    </div>
  )
}
