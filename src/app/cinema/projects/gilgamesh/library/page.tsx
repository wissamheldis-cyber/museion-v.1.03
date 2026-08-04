'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { CinemaSidebar } from '@/components/layout/CinemaSidebar'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function LibraryPage() {
  const router = useRouter()
  const { setAuth, setProfile } = useMuseionStore()
  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) { router.replace('/login'); return }
    setAuth(session)
    const profile = localAuthAdapter.getProfile()
    if (profile) setProfile(profile)
  }, [router, setAuth, setProfile])
  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      <CinemaSidebar projectSlug="gilgamesh" />
      <SprintPlaceholder title="Bibliothèque" sprint={3} projectSlug="gilgamesh" />
    </div>
  )
}
