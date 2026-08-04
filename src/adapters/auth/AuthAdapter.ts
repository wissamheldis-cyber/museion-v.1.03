import type { AuthSession, StudioProfile } from '@/lib/types'

// ============================================================
// AuthAdapter — Interface d'authentification abstraite
// ============================================================

export interface AuthAdapter {
  /**
   * Tente d'authentifier avec un nom de profil.
   * Retourne la session si succès, null si échec.
   */
  signIn(profileName: string): Promise<AuthSession | null>

  /**
   * Termine la session courante.
   */
  signOut(): Promise<void>

  /**
   * Retourne la session active, ou null.
   */
  getSession(): AuthSession | null

  /**
   * Retourne le profil complet si connecté.
   */
  getProfile(): StudioProfile | null
}

// ============================================================
// FutureSupabaseAuthAdapterContract — Contrat V2
// ============================================================

/**
 * Ce type documente le contrat que devra implémenter
 * SupabaseAuthAdapter en V2. Non utilisé en V1.
 */
export interface FutureSupabaseAuthAdapterContract extends AuthAdapter {
  signInWithEmail(email: string, password: string): Promise<AuthSession | null>
  refreshSession(): Promise<AuthSession | null>
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
