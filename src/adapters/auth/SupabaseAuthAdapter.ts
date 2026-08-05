import type { User } from '@supabase/supabase-js'
import type { AuthAdapter } from './AuthAdapter'
import type { AuthSession, StudioProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

function supabase() {
  return createClient()
}

let cachedSession: AuthSession | null = null
let cachedProfile: StudioProfile | null = null
const listeners = new Set<(session: AuthSession | null) => void>()

function toAuthSession(user: User | null): AuthSession | null {
  if (!user) return null
  return {
    profileId: user.id,
    displayName:
      (user.user_metadata?.display_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Utilisateur',
    authenticatedAt: new Date().toISOString(),
  }
}

function toStudioProfile(session: AuthSession | null): StudioProfile | null {
  if (!session) return null
  return {
    id: session.profileId,
    name: session.displayName,
    displayName: session.displayName,
    role: 'administrator',
    createdAt: session.authenticatedAt,
  }
}

function applySession(user: User | null) {
  cachedSession = toAuthSession(user)
  cachedProfile = toStudioProfile(cachedSession)
  listeners.forEach((callback) => callback(cachedSession))
}

// Ce module est importé par un composant 'use client' (StoreHydration) qui
// est lui-même évalué côté serveur pendant le rendu/prerendering Next.js.
// Sans ce garde, createBrowserClient() s'exécute pendant le build (où les
// variables d'environnement peuvent ne pas être injectées) et fait échouer
// la génération des pages statiques comme /_not-found.
if (typeof window !== 'undefined') {
  supabase().auth.onAuthStateChange((_event, session) => {
    applySession(session?.user ?? null)
  })

  // Populate the cache immediately so getSession() has a value before the
  // first onAuthStateChange fires (avoids a false "logged out" flash).
  supabase().auth.getUser().then(({ data }) => {
    applySession(data.user ?? null)
  })
}

// ============================================================
// SupabaseAuthAdapter — Implémentation V2 (auth réelle)
// ============================================================

export class SupabaseAuthAdapter implements AuthAdapter {
  async signIn(): Promise<AuthSession | null> {
    throw new Error('SupabaseAuthAdapter.signIn: utilisez signInWithEmail(email, password).')
  }

  async signInWithEmail(email: string, password: string): Promise<AuthSession | null> {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password })
    if (error || !data.user) return null
    applySession(data.user)
    return cachedSession
  }

  async signOut(): Promise<void> {
    await supabase().auth.signOut()
    applySession(null)
  }

  getSession(): AuthSession | null {
    return cachedSession
  }

  getProfile(): StudioProfile | null {
    return cachedProfile
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })
    if (error) throw error
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase().auth.updateUser({ password: newPassword })
    if (error) throw error
  }
}

export const supabaseAuthAdapter = new SupabaseAuthAdapter()
