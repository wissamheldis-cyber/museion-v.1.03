'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useMuseionStore } from '@/store/museionStore'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Camera,
  Film,
  Monitor,
  Star,
  Library,
  Package,
  LogOut,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/cinema', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/cinema/projects', label: 'Projets', icon: FolderOpen },
]

interface CinemaSidebarProps {
  projectSlug?: string
}

const PROJECT_NAV_ITEMS = (slug: string) => [
  { href: `/cinema/projects/${slug}`, label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: `/cinema/projects/${slug}/development`, label: 'Développement', icon: FileText },
  { href: `/cinema/projects/${slug}/storyboard`, label: 'Storyboard', icon: Camera },
  { href: `/cinema/projects/${slug}/plans`, label: 'Plans', icon: Film },
  { href: `/cinema/projects/${slug}/production`, label: 'Production', icon: Monitor },
  { href: `/cinema/projects/${slug}/review`, label: 'Review', icon: Star },
  { href: `/cinema/projects/${slug}/library`, label: 'Bibliothèque', icon: Library },
  { href: `/cinema/projects/${slug}/deliverables`, label: 'Livrables', icon: Package },
]

export function CinemaSidebar({ projectSlug }: CinemaSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useMuseionStore()
  const studioProfile = useMuseionStore((s) => s.studioProfile)
  const projects = useMuseionStore((s) => s.projects)
  const activeProject = projectSlug ? projects.find((p) => p.slug === projectSlug) : null

  const handleSignOut = async () => {
    await localAuthAdapter.signOut()
    signOut()
    router.push('/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }


  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 glass border-r border-[var(--glass-border)] z-20">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--border-subtle)]">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/brand/museion-logo.png"
            alt="Museion"
            width={28}
            height={28}
            className="rounded object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <span className="text-sm font-semibold tracking-[0.12em] text-[var(--text-primary)] uppercase">
            Museion
          </span>
        </Link>
      </div>

      {/* Projet actif */}
      {activeProject && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1">Projet</p>
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{activeProject.title}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {activeProject.status === 'development' ? 'En développement' :
             activeProject.status === 'pre-production' ? 'Pré-production' :
             activeProject.status}
          </p>
        </div>
      )}

      {/* Navigation principale */}
      {!projectSlug && (
        <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest px-2 mb-2">Cinéma</p>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href, item.exact)} />
          ))}
        </div>
      )}

      {/* Navigation projet */}
      {projectSlug && (
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest px-2 mb-2">Navigation</p>
          {PROJECT_NAV_ITEMS(projectSlug).map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href, item.exact)} />
          ))}
          <div className="mt-4 px-2">
            <Link
              href="/cinema/projects"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← Tous les projets
            </Link>
          </div>
        </nav>
      )}

      {!projectSlug && <div className="flex-1" />}

      {/* Projets récents (sidebar globale) */}
      {!projectSlug && (
        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest px-2 mb-2">Récents</p>
          {projects.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/cinema/projects/${p.slug}`}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs transition-all',
                isActive(`/cinema/projects/${p.slug}`)
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] opacity-60 shrink-0" />
              <span className="truncate">{p.title}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Profil */}
      <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)]">
          <div className="w-6 h-6 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center shrink-0">
            <User size={12} className="text-[var(--accent-blue)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {studioProfile?.displayName ?? 'Administrateur'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded"
            title="Se déconnecter"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  exact?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-sm)] text-sm transition-all duration-[var(--transition-fast)]',
        active
          ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-medium'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </Link>
  )
}
