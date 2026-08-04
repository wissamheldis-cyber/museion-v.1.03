'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'
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
  const isV2Hydrated = useMuseionStore((s) => s.isV2Hydrated)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange((session) => {
      if (session) {
        setAuth(session)
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
      return unsubscribe
    }

    // Middleware already confirmed a valid session server-side; the client
    // cache may just not be populated yet. Give it a moment before treating
    // this as a real sign-out.
    const timeout = setTimeout(() => {
      if (!supabaseAuthAdapter.getSession()) router.replace('/login')
    }, 800)
    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
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
      <div className="museion-global-wrapper relative flex h-screen w-screen items-center justify-center overflow-hidden bg-transparent p-2.5 sm:p-3 md:p-4">
        {/* Fond global séparé — personnalisable avec lumière centrale */}
        <div 
          className="museion-global-bg pointer-events-none absolute inset-0 z-0" 
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.06) 0%, transparent 60%)'
          }}
        />

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
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {!isV2Hydrated ? (
                <div className="flex h-full items-center justify-center text-white/50">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                    <span>Chargement des données du studio...</span>
                  </div>
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
      {isV2Hydrated && <DemoTourController />}
    </DemoTourProvider>
  )
}
