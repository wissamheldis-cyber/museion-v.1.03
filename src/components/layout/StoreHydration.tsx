'use client'

import { useEffect } from 'react'
import { useMuseionStore } from '@/store/museionStore'

/**
 * Le store est persisté dans localStorage, absent du rendu serveur.
 * On le réhydrate après le montage : le premier rendu client est ainsi
 * identique au rendu serveur, et React n'a plus de désaccord d'hydratation.
 */
export function StoreHydration() {
  useEffect(() => {
    void useMuseionStore.persist.rehydrate()
  }, [])

  return null
}
