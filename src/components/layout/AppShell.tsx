'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { DemoTourProvider } from '@/components/tour/DemoTourProvider'
import { DemoTourController } from '@/components/tour/DemoTourController'
import { CinemaSidebar } from './CinemaSidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  projectSlug?: string
  /** Onglets centraux de la barre supérieure (ref3, ref4). */
  tabs?: { id: string; label: string }[]
  activeTab?: string
  onTabChange?: (id: string) => void
}

/**
 * Coquille commune : barre supérieure pleine largeur, navigation à gauche,
 * contenu à droite. Structure de references/ref1-4.
 */
export function AppShell({ children, projectSlug, tabs, activeTab, onTabChange }: AppShellProps) {
  const router = useRouter()
  const setAuth = useMuseionStore((s) => s.setAuth)
  const setProfile = useMuseionStore((s) => s.setProfile)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    setAuth(session)
    const profile = localAuthAdapter.getProfile()
    if (profile) setProfile(profile)
  }, [router, setAuth, setProfile])

  // Sous 1280 px, la navigation se replie pour laisser la place au contenu
  useEffect(() => {
    const apply = () => setCollapsed(window.innerWidth < 1280)
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  return (
    <DemoTourProvider>
      <div className="museion-global-wrapper relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#050608] p-2.5 sm:p-3 md:p-4">
        {/* Fond global séparé — personnalisable */}
        <div className="museion-global-bg pointer-events-none absolute inset-0 z-0" />

        {/* Shell principal centré ("Fenêtre Dashboard Cockpit") */}
        <div className="museion-cockpit-shell relative z-10 flex h-full w-full max-w-[1760px] flex-col overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.92)] ring-1 ring-white/[0.04]">
          <TopBar
            projectSlug={projectSlug}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <div className="flex min-h-0 flex-1">
            <CinemaSidebar
              projectSlug={projectSlug}
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed((value) => !value)}
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
          </div>
        </div>
      </div>
      <DemoTourController />
    </DemoTourProvider>
  )
}
