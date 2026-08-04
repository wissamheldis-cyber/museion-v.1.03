'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import {
  Plus,
  Search,
  Film,
  Star,
  Archive,
  ChevronDown,
} from 'lucide-react'
import { FORMAT_LABELS, GENRE_LABELS, STATUS_LABELS, cn } from '@/lib/utils'
import type { Project } from '@/lib/types'

const STATUSES = ['', 'draft', 'concept', 'development', 'pre-production', 'production', 'post-production']
const FORMATS = ['', 'feature', 'short', 'documentary', 'series']
const GENRES = ['', 'historical', 'epic', 'drama', 'thriller', 'documentary', 'fantasy', 'scifi', 'comedy']

export default function ProjectsListPage() {
  const router = useRouter()
  const { projects, toggleFavorite} = useMuseionStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (p.isArchived !== showArchived) return false
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.logline.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter && p.status !== statusFilter) return false
      if (formatFilter && p.format !== formatFilter) return false
      if (genreFilter && p.genre !== genreFilter) return false
      return true
    })
  }, [projects, search, statusFilter, formatFilter, genreFilter, showArchived])

  const favorites = projects.filter((p) => p.isFavorite && !p.isArchived)
  const archived = projects.filter((p) => p.isArchived)


  return (
    <AppShell>

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tous les projets cinéma</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Retrouvez vos films, documentaires et projets en développement.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/cinema/projects/new')}
          >
            <Plus size={15} />
            Nouveau projet cinéma
          </Button>
        </div>

        <div className="flex gap-6 px-8 py-6">
          {/* Liste principale */}
          <div className="flex-1 min-w-0">
            {/* Barre de recherche et filtres */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher un projet…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] pl-8 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--interactive)] transition-colors"
                />
              </div>
              <FilterSelect
                value={formatFilter}
                onChange={setFormatFilter}
                options={FORMATS.map((f) => ({ value: f, label: f ? FORMAT_LABELS[f] : 'Tous les formats' }))}
              />
              <FilterSelect
                value={genreFilter}
                onChange={setGenreFilter}
                options={GENRES.map((g) => ({ value: g, label: g ? GENRE_LABELS[g] : 'Tous les genres' }))}
              />
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUSES.map((s) => ({ value: s, label: s ? STATUS_LABELS[s] : 'Tous les statuts' }))}
              />
            </div>

            {/* Résultats */}
            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-[var(--text-muted)]">
                  <Film size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun projet ne correspond à vos critères.</p>
                </div>
              )}
              {filtered.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onToggleFavorite={() => toggleFavorite(project.id)}
                />
              ))}
            </div>
          </div>

          {/* Panneau latéral droit */}
          <div className="w-52 shrink-0 space-y-6">
            {/* Collections */}
            <div>
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Collections
              </h3>
              <div className="space-y-1">
                {['Long métrages', 'Documentaires', 'Courts métrages'].map((col) => (
                  <button
                    key={col}
                    className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Favoris */}
            <div>
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Star size={11} />
                Favoris
              </h3>
              <div className="space-y-1">
                {favorites.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] px-2">Aucun favori</p>
                )}
                {favorites.map((p) => (
                  <Link
                    key={p.id}
                    href={`/cinema/projects/${p.slug}`}
                    className="block text-xs text-[var(--text-secondary)] hover:text-[var(--interactive)] px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface)] transition-colors truncate"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>

            {/* Archives */}
            <div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 hover:text-[var(--text-secondary)] transition-colors"
              >
                <Archive size={11} />
                Archives ({archived.length})
              </button>
              {showArchived && archived.map((p) => (
                <Link
                  key={p.id}
                  href={`/cinema/projects/${p.slug}`}
                  className="block text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 py-1.5 truncate"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ProjectRow({ project, onToggleFavorite }: { project: Project; onToggleFavorite: () => void }) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
      {/* Miniature */}
      <div className="w-20 h-14 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 overflow-hidden">
        <div
          className="w-full h-full opacity-30"
          style={{
            background: project.slug === 'gilgamesh'
              ? 'linear-gradient(135deg, #2a2b2f, #0d0e11)'
              : project.slug === 'akhenaton'
              ? 'linear-gradient(135deg, #35363a, #0d0e11)'
              : project.slug === 'alexandre'
              ? 'linear-gradient(135deg, #202126, #0d0e11)'
              : project.slug === 'civilisation'
              ? 'linear-gradient(135deg, #26272b, #0d0e11)'
              : 'linear-gradient(135deg, #1c1d21, #0d0e11)',
          }}
        />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/cinema/projects/${project.slug}`}
            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--interactive)] transition-colors truncate"
          >
            {project.title}
          </Link>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-xs text-[var(--text-muted)] truncate mb-2">
          {project.logline || 'Aucune logline'}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)]">
            {FORMAT_LABELS[project.format]}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">·</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {GENRE_LABELS[project.genre]}
          </span>
          <div className="flex-1 max-w-24">
            <ProgressBar value={project.completionPercent} />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{project.completionPercent}%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleFavorite}
          className={cn(
            'p-1.5 rounded transition-colors',
            project.isFavorite
              ? 'text-[var(--state-warn)] hover:text-amber-300'
              : 'text-[var(--text-muted)] hover:text-[var(--state-warn)]'
          )}
          title={project.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star size={14} fill={project.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <Link
          href={`/cinema/projects/${project.slug}`}
          className="text-xs text-[var(--interactive)] hover:text-[var(--interactive-hover)] transition-colors px-2 py-1 rounded bg-[var(--interactive-dim)]"
        >
          Ouvrir
        </Link>
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] pl-3 pr-7 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--interactive)] cursor-pointer transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-surface)]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
    </div>
  )
}
