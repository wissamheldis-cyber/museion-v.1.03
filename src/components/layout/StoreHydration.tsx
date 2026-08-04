'use client'

import { useEffect } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'

/**
 * Le store est persisté dans localStorage, absent du rendu serveur.
 * On le réhydrate après le montage : le premier rendu client est ainsi
 * identique au rendu serveur, et React n'a plus de désaccord d'hydratation.
 */
export function StoreHydration() {
  useEffect(() => {
    // 2. Réhydrater les préférences UI
    void useMuseionStore.persist.rehydrate()

    // 3. Charger les données métier depuis Supabase (si une session existe déjà)
    useMuseionStore.getState().initV2()

    // 4. Une connexion peut survenir après ce montage (formulaire de login) :
    // relancer l'hydratation dès qu'une session apparaît, et vider les
    // données de studio dès qu'elle disparaît.
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange((session) => {
      if (session) {
        useMuseionStore.getState().initV2()
      } else {
        useMuseionStore.getState().signOut()
      }
    })

    return unsubscribe
  }, [])

  return null
}
