'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { CinemaSidebar } from '@/components/layout/CinemaSidebar'
import { StatusBadge, TraceBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { FORMAT_LABELS, formatRelativeDate } from '@/lib/utils'
import {
  FileText,
  Camera,
  Film,
  Monitor,
  Star,
  Library,
  Package,
  ChevronRight,
} from 'lucide-react'

const QUICK_LINKS = [
  { href: '/cinema/projects/gilgamesh/development', label: 'Développement', icon: FileText, desc: 'Vision, logline, scénario, personnages' },
  { href: '/cinema/projects/gilgamesh/storyboard', label: 'Storyboard', icon: Camera, desc: 'Séquences et plans visuels' },
  { href: '/cinema/projects/gilgamesh/plans', label: 'Plans & caméra', icon: Film, desc: 'Découpage technique' },
  { href: '/cinema/projects/gilgamesh/production', label: 'Production', icon: Monitor, desc: 'Génération visuelle' },
  { href: '/cinema/projects/gilgamesh/review', label: 'Review', icon: Star, desc: 'Validations et commentaires' },
  { href: '/cinema/projects/gilgamesh/library', label: 'Bibliothèque', icon: Library, desc: 'Assets du projet' },
  { href: '/cinema/projects/gilgamesh/deliverables', label: 'Livrables', icon: Package, desc: 'Exports finaux' },
]

export default function GilgameshWorkspacePage() {
  const router = useRouter()
  const { projects, setAuth, setProfile } = useMuseionStore()

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) { router.replace('/login'); return }
    setAuth(session)
    const profile = localAuthAdapter.getProfile()
    if (profile) setProfile(profile)
  }, [router, setAuth, setProfile])

  const project = projects.find((p) => p.slug === 'gilgamesh')
  if (!project) return null

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      <CinemaSidebar projectSlug="gilgamesh" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
            <Link href="/cinema" className="hover:text-[var(--text-secondary)] transition-colors">Cinéma</Link>
            <ChevronRight size={12} />
            <Link href="/cinema/projects" className="hover:text-[var(--text-secondary)] transition-colors">Projets</Link>
            <ChevronRight size={12} />
            <span className="text-[var(--text-secondary)]">{project.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{project.title}</h1>
              <StatusBadge status={project.status} />
              <span className="text-sm text-[var(--text-muted)]">{FORMAT_LABELS[project.format]}</span>
            </div>
            <Button variant="primary" onClick={() => router.push('/cinema/projects/gilgamesh/development')}>
              Reprendre le développement
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Progression */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">Progression globale</p>
              <span className="text-sm font-semibold text-[var(--accent-blue)]">{project.completionPercent}%</span>
            </div>
            <ProgressBar value={project.completionPercent} color="blue" className="mb-4" />
            <p className="text-xs text-[var(--text-muted)]">
              Dernière modification {formatRelativeDate(project.updatedAt)}
            </p>
          </div>

          {/* Logline */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Logline</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 py-3">
              &ldquo;{project.logline}&rdquo;
            </p>
          </div>

          {/* Navigation rapide */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Sections du projet</h2>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-blue-dim)] transition-colors">
                    <link.icon size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{link.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Personnages */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
              Personnages ({project.characters.length})
            </h2>
            <div className="flex gap-3">
              {project.characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)]"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
                    {char.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{char.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{char.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traces créatives */}
          {project.traces.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                Décisions & questions
              </h2>
              <div className="space-y-2">
                {project.traces.map((trace) => (
                  <div
                    key={trace.id}
                    className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)]"
                  >
                    <TraceBadge status={trace.status} className="shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--text-secondary)]">{trace.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
