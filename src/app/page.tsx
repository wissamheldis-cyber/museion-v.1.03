'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { Clapperboard, Megaphone, Plus, Lock, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function HomePage() {
  const router = useRouter()
  const { signOut, studioProfile, setAuth, setProfile } = useMuseionStore()
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

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
      if (!studioProfile) {
        setAuth(existing)
        const profile = supabaseAuthAdapter.getProfile()
        if (profile) setProfile(profile)
      }
      return unsubscribe
    }

    const timeout = setTimeout(() => {
      if (!supabaseAuthAdapter.getSession()) router.replace('/login')
    }, 800)
    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [router, studioProfile, setAuth, setProfile])

  const handleSignOut = async () => {
    await supabaseAuthAdapter.signOut()
    signOut()
    router.push('/login')
  }

  if (!isMounted) return null

  return (
    <div className="museion-global-wrapper relative flex h-screen w-screen items-center justify-center overflow-hidden bg-transparent p-2.5 sm:p-3 md:p-4">
      {/* Fond global séparé — personnalisable */}
      <div className="museion-global-bg pointer-events-none absolute inset-0 z-0" />

      {/* Shell principal centré ("Fenêtre Dashboard Cockpit") */}
      <div className="museion-cockpit-shell relative z-10 flex h-full w-full max-w-[1760px] flex-col overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.92)] ring-1 ring-white/[0.04]">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center">
            <Image
              src="/brand/museion-mark.png"
              alt="Museion"
              width={160}
              height={160}
              className="object-contain opacity-90"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-7 h-7 rounded-full bg-[var(--interactive)]/20 flex items-center justify-center">
                <User size={14} className="text-[var(--interactive)]" />
              </div>
              <span>{studioProfile?.displayName ?? 'Administrateur'}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 overflow-y-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">
              Bonjour, {studioProfile?.displayName ?? 'Administrateur'}
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              Choisissez un espace pour commencer.
            </p>
          </div>

          {/* Cartes espaces */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
            {/* Cinéma — actif */}
            <Link href="/cinema" className="group block">
              <div className={cn(
                'relative rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-card)] p-8 flex flex-col gap-4',
                'transition-all duration-[var(--transition-base)]',
                'hover:border-[var(--interactive)]/40 hover:bg-[var(--bg-card-hover)] hover:scale-[1.02]'
              )}>
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--interactive-dim)] flex items-center justify-center">
                  <Clapperboard size={22} className="text-[var(--interactive)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
                    Cinéma
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Films, documentaires et récits ambitieux.
                  </p>
                </div>
                <span className="mt-auto text-xs font-medium text-[var(--interactive)] flex items-center gap-1.5 transition-all">
                  Ouvrir →
                </span>
              </div>
            </Link>

            {/* Publicité — verrouillé */}
            <div className="relative rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 flex flex-col gap-4 opacity-60 cursor-not-allowed select-none">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Bientôt disponible
                </span>
              </div>
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] flex items-center justify-center">
                <Megaphone size={22} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
                  Publicité
                  <Lock size={12} className="text-[var(--text-muted)]" />
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Spots, campagnes et contenus de marque.
                </p>
              </div>
            </div>

            {/* Projet personnalisé — verrouillé */}
            <div className="relative rounded-[var(--radius-xl)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-8 flex flex-col gap-4 opacity-50 cursor-not-allowed select-none">
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] flex items-center justify-center">
                <Plus size={22} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
                  Ajouter un projet
                  <Lock size={12} className="text-[var(--text-muted)]" />
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Créez un espace personnalisé avec ses propres workflows, connaissances et outils.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
