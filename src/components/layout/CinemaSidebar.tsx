'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMuseionStore } from '@/store/museionStore'
import { StatusDot } from '@/components/ui/Badge'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { sceneThumbUrl } from '@/components/storyboard/sceneVisual'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Camera,
  Film,
  Boxes,
  Workflow,
  Monitor,
  Star,
  Library,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/cinema', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/cinema/projects', label: 'Projets', icon: FolderOpen },
]

const PROJECT_NAV_ITEMS = (slug: string) => [
  { href: `/cinema/projects/${slug}`, label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: `/cinema/projects/${slug}/development`, label: 'Développement', icon: FileText },
  { href: `/cinema/projects/${slug}/writing-assistant`, label: 'Assistance à l’écriture', icon: PenLine },
  { href: `/cinema/projects/${slug}/storyboard`, label: 'Storyboard', icon: Camera },
  { href: `/cinema/projects/${slug}/board`, label: 'Tableau dynamique', icon: Workflow },
  { href: `/cinema/projects/${slug}/plans`, label: 'Plans & caméra', icon: Film },
  { href: `/cinema/projects/${slug}/previs`, label: 'Previs', icon: Boxes },
  { href: `/cinema/projects/${slug}/production`, label: 'Production', icon: Monitor },
  { href: `/cinema/projects/${slug}/review`, label: 'Review', icon: Star },
  { href: `/cinema/projects/${slug}/library`, label: 'Bibliothèque', icon: Library },
  { href: `/cinema/projects/${slug}/deliverables`, label: 'Livrables', icon: Package },
]

interface CinemaSidebarProps {
  projectSlug?: string
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function CinemaSidebar({ projectSlug, collapsed, onToggleCollapsed }: CinemaSidebarProps) {
  const pathname = usePathname()
  const projects = useMuseionStore((s) => s.projects)
  const scenes = useMuseionStore((s) => s.scenes)
  const assets = useMuseionStore((s) => s.assets)
  const activeProject = projectSlug ? projects.find((p) => p.slug === projectSlug) : null

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const items = projectSlug ? PROJECT_NAV_ITEMS(projectSlug) : NAV_ITEMS
  const coverScene = activeProject
    ? scenes.find((s) => s.projectId === activeProject.id)
    : undefined

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-base)] transition-[width] duration-[var(--transition-base)]"
      style={{ width: collapsed ? 64 : 228 }}
      aria-label="Navigation"
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {items.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={isActive(item.href, 'exact' in item ? item.exact : undefined)}
          />
        ))}

        {projectSlug && !collapsed && (
          <Link
            href="/cinema/projects"
            className="mt-4 block px-3 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            ← Tous les projets
          </Link>
        )}
      </nav>

      {/* Carte projet, comme dans ref1-4 */}
      {activeProject && !collapsed && (
        <div className="mx-2 mb-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
          <div className="flex items-center gap-2.5">
            {coverScene ? (
              <PreviewFrame
                url={sceneThumbUrl(coverScene, assets)}
                alt={activeProject.title}
                className="h-9 w-[52px] shrink-0 overflow-hidden rounded-[3px]"
              />
            ) : (
              <div className="h-9 w-[52px] shrink-0 rounded-[3px] bg-[var(--bg-elevated)]" />
            )}
            <p className="min-w-0 flex-1 truncate text-xs uppercase tracking-[0.08em] text-[var(--text-primary)]">
              {activeProject.title}
            </p>
          </div>

          <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full bg-[var(--interactive)] transition-all duration-500"
              style={{ width: `${activeProject.completionPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <StatusDot state="ok" label="On Track" className="text-[10px]" />
            <span className="metric text-[11px] text-[var(--text-secondary)]">
              {activeProject.completionPercent}%
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--border-subtle)] p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
          title={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
          aria-pressed={collapsed}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  collapsed: boolean
  exact?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'relative mb-0.5 flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-colors duration-[var(--transition-fast)]',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-[var(--interactive-dim)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
      )}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-px bg-[var(--interactive)]" aria-hidden="true" />
      )}
      <Icon size={15} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
