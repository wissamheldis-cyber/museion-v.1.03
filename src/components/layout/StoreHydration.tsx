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
    // 2. Réhydrater les préférences UI
    void useMuseionStore.persist.rehydrate()

    // 3. Charger les données métier V2
    useMuseionStore.getState().initV2()
  }, [])

  return null
}

