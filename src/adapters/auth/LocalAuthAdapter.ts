import type { AuthAdapter } from './AuthAdapter'
import type { AuthSession, StudioProfile } from '@/lib/types'
import { DEMO_STUDIO_PROFILE } from '@/lib/demo-data'

const SESSION_KEY = 'museion_session'
const ACCEPTED_PROFILE = 'administrateur'

// ============================================================
// LocalAuthAdapter — Implémentation V1 (sans backend)
// ============================================================

export class LocalAuthAdapter implements AuthAdapter {
  async signIn(profileName: string): Promise<AuthSession | null> {
    if (profileName.trim().toLowerCase() !== ACCEPTED_PROFILE) {
      return null
    }

    const session: AuthSession = {
      profileId: DEMO_STUDIO_PROFILE.id,
      displayName: DEMO_STUDIO_PROFILE.displayName,
      authenticatedAt: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }

    return session
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  }

  getProfile(): StudioProfile | null {
    const session = this.getSession()
    if (!session) return null
    return DEMO_STUDIO_PROFILE
  }
}

export const localAuthAdapter = new LocalAuthAdapter()
