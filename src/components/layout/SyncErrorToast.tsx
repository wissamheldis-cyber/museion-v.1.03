'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'

const AUTO_DISMISS_MS = 6000

/**
 * Surfaces a background write failure (optimistic local update whose sync
 * to Supabase failed). Non-blocking — the local change stays visible, this
 * just tells the user it may not be saved.
 */
export function SyncErrorToast() {
  const syncError = useMuseionStore((s) => s.syncError)
  const dismissSyncError = useMuseionStore((s) => s.dismissSyncError)

  useEffect(() => {
    if (!syncError) return
    const timeout = setTimeout(() => dismissSyncError(), AUTO_DISMISS_MS)
    return () => clearTimeout(timeout)
  }, [syncError, dismissSyncError])

  if (!syncError) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--state-warn)]/25 bg-[var(--bg-surface)] px-4 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] transition-opacity duration-200">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--state-warn)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-[var(--text-primary)]">Synchronisation échouée</span>
          <span className="text-xs text-[var(--text-muted)]">
            Une modification n&apos;a peut-être pas été sauvegardée ({syncError}). Vérifie ta connexion.
          </span>
        </div>
        <button
          type="button"
          onClick={dismissSyncError}
          aria-label="Fermer"
          className="ml-1 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
