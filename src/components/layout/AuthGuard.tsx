'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMuseionStore } from '@/store/museionStore'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { auth, setAuth, setProfile } = useMuseionStore()

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    if (!auth) {
      setAuth(session)
      const profile = localAuthAdapter.getProfile()
      if (profile) setProfile(profile)
    }
  }, [auth, router, setAuth, setProfile])

  const session = localAuthAdapter.getSession()
  if (!session) return null

  return <>{children}</>
}
