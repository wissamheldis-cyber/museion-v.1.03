'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMuseionStore } from '@/store/museionStore'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { setAuth, setProfile } = useMuseionStore()
  const [session, setSession] = useState(() => supabaseAuthAdapter.getSession())

  useEffect(() => {
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange((next) => {
      setSession(next)
      if (next) {
        setAuth(next)
        const profile = supabaseAuthAdapter.getProfile()
        if (profile) setProfile(profile)
      } else {
        router.replace('/login')
      }
    })

    const existing = supabaseAuthAdapter.getSession()
    if (existing) {
      setAuth(existing)
      const profile = supabaseAuthAdapter.getProfile()
      if (profile) setProfile(profile)
    }

    return unsubscribe
  }, [router, setAuth, setProfile])

  if (!session) return null

  return <>{children}</>
}
