'use client'

import { cn } from '@/lib/utils'

interface PreviewFrameProps {
  url: string
  alt: string
  className?: string
  children?: React.ReactNode
}

/**
 * Affiche une composition locale (data URI SVG) sans balise <img>,
 * pour rester cohérent avec le chargement d'images de Next.
 */
export function PreviewFrame({ url, alt, className, children }: PreviewFrameProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('relative bg-[var(--bg-elevated)] bg-cover bg-center', className)}
      style={{ backgroundImage: `url("${url}")` }}
    >
      {children}
    </div>
  )
}
