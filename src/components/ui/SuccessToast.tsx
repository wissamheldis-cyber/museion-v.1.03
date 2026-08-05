'use client'

import { useEffect } from 'react'
import { Check, X } from 'lucide-react'

const AUTO_DISMISS_MS = 4000

interface SuccessToastProps {
  message: string | null
  onDismiss: () => void
}

/**
 * Confirmation transitoire non bloquante (bas-droite), pour remplacer les
 * `window.alert()` — qui gèlent l'interface et ne suivent pas la charte.
 */
export function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timeout)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--state-ok)]/25 bg-[var(--bg-surface)] px-4 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
        <Check size={16} className="mt-0.5 shrink-0 text-[var(--state-ok)]" />
        <span className="text-xs text-[var(--text-primary)]">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="ml-1 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
