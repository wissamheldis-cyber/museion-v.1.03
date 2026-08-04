'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, LogOut, Search, User } from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { FORMAT_LABELS, cn } from '@/lib/utils'

interface TopBarProps {
  projectSlug?: string
  /** Onglets centraux, comme dans ref3 et ref4. */
  tabs?: { id: string; label: string }[]
  activeTab?: string
  onTabChange?: (id: string) => void
}

export function TopBar({ projectSlug, tabs, activeTab, onTabChange }: TopBarProps) {
  const router = useRouter()
  const projects = useMuseionStore((s) => s.projects)
  const studioProfile = useMuseionStore((s) => s.studioProfile)
  const signOut = useMuseionStore((s) => s.signOut)

  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const projectRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const project = projectSlug ? projects.find((p) => p.slug === projectSlug) : undefined

  useEffect(() => {
    if (!projectMenuOpen && !profileMenuOpen) return
    const onClickAway = (event: MouseEvent) => {
      const target = event.target as Node
      if (!projectRef.current?.contains(target)) setProjectMenuOpen(false)
      if (!profileRef.current?.contains(target)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [projectMenuOpen, profileMenuOpen])

  const handleSignOut = async () => {
    await localAuthAdapter.signOut()
    signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-20 shrink-0 items-stretch border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
      {/* Logo Museion — marque graphique seule, sans lettrage */}
      <Link
        href="/"
        aria-label="Museion — accueil"
        title="Museion"
        className="flex shrink-0 items-center border-r border-[var(--border-subtle)] pl-5 pr-6 focus-visible:outline-none"
      >
        <Image
          src="/brand/museion-mark.png"
          alt="Museion"
          width={120}
          height={76}
          priority
          className="h-[68px] w-auto opacity-95 transition-opacity hover:opacity-100"
        />
      </Link>

      {/* Sélecteur de projet */}
      {project && (
        <div className="relative flex shrink-0 items-center border-r border-[var(--border-subtle)]" ref={projectRef}>
          <button
            type="button"
            onClick={() => setProjectMenuOpen((open) => !open)}
            aria-expanded={projectMenuOpen}
            aria-label="Changer de projet"
            className="flex h-full items-center gap-3 px-5 transition-colors hover:bg-[var(--bg-surface)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-card)] text-[10px] text-[var(--text-secondary)]">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-left">
              <span className="block text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-primary)]">
                {project.title}
              </span>
              <span className="block text-[11px] text-[var(--text-muted)]">
                {FORMAT_LABELS[project.format]}
              </span>
            </span>
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          </button>

          {projectMenuOpen && (
            <div className="absolute left-3 top-[calc(100%-6px)] z-40 w-72 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-2xl">
              {projects
                .filter((p) => !p.isArchived)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProjectMenuOpen(false)
                      router.push(`/cinema/projects/${p.slug}`)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-[var(--text-primary)]">{p.title}</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">
                        {FORMAT_LABELS[p.format]}
                      </span>
                    </span>
                    {p.slug === projectSlug && (
                      <Check size={13} className="shrink-0 text-[var(--text-secondary)]" />
                    )}
                  </button>
                ))}
              <Link
                href="/cinema/projects"
                onClick={() => setProjectMenuOpen(false)}
                className="mt-1 block border-t border-[var(--border-subtle)] px-3 py-2 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                Tous les projets
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Onglets centraux */}
      <div className="flex min-w-0 flex-1 items-stretch">
        {tabs && tabs.length > 0 && (
          <nav className="flex items-stretch" role="tablist" aria-label="Sections">
            {tabs.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    'relative px-5 text-[11px] uppercase tracking-[var(--tracking-label)] transition-colors',
                    active
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute inset-x-4 bottom-0 h-px bg-[var(--interactive)]" />
                  )}
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 px-5">
        <Link
          href="/cinema/projects"
          title="Rechercher un projet"
          aria-label="Rechercher un projet"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          <Search size={15} />
        </Link>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
            aria-label="Profil du studio"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:border-[var(--interactive-border)] hover:text-[var(--text-primary)]"
          >
            <User size={14} />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-11 z-40 w-56 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 shadow-2xl">
              <div className="px-3 py-2">
                <p className="text-xs text-[var(--text-primary)]">
                  {studioProfile?.displayName ?? 'Administrateur'}
                </p>
                <p className="label-caps mt-0.5">Profil local</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border-t border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <LogOut size={13} />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  )
}
