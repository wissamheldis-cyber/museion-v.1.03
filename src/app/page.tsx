'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { Clapperboard, Megaphone, Plus, Lock, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const { signOut, studioProfile, setAuth, setProfile } = useMuseionStore()

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    if (!studioProfile) {
      setAuth(session)
      const profile = localAuthAdapter.getProfile()
      if (profile) setProfile(profile)
    }
  }, [router, studioProfile, setAuth, setProfile])

  const handleSignOut = async () => {
    await localAuthAdapter.signOut()
    signOut()
    router.push('/login')
  }

  const session = localAuthAdapter.getSession()
  if (!session) return null

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/museion-logo.png"
            alt="Museion"
            width={32}
            height={32}
            className="object-contain opacity-90"
          />
          <span className="text-sm font-semibold tracking-[0.15em] text-[var(--text-primary)] uppercase">
            Museion
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center">
              <User size={14} className="text-[var(--accent-blue)]" />
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
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
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
              'hover:border-[var(--accent-blue)]/40 hover:bg-[var(--bg-card-hover)] hover:scale-[1.02]'
            )}>
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--accent-blue-dim)] flex items-center justify-center">
                <Clapperboard size={22} className="text-[var(--accent-blue)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
                  Cinéma
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Films, documentaires et récits ambitieux.
                </p>
              </div>
              <span className="mt-auto text-xs font-medium text-[var(--accent-blue)] flex items-center gap-1.5 transition-all">
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
  )
}
