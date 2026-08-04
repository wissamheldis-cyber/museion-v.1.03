'use client'

import { useMuseionStore } from '@/store/museionStore'
import { Check } from 'lucide-react'

export function SaveIndicator() {
  const savedIndicator = useMuseionStore((s) => s.savedIndicator)

  if (!savedIndicator) return null

  return (
    <span className="save-indicator inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <Check size={12} className="text-green-400" />
      Sauvegardé localement
    </span>
  )
}
