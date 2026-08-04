'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMuseionStore } from '@/store/museionStore'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Plus, ChevronRight, Film, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { FORMAT_LABELS } from '@/lib/utils'

export default function CinemaDashboardPage() {
  const router = useRouter()
  const { projects} = useMuseionStore()



  const activeProjects = projects.filter((p) => !p.isArchived && p.status !== 'draft').slice(0, 3)
  const pendingValidations = [
    { id: 'v1', title: 'Traitement — Gilgamesh', type: 'Traitement', project: 'Gilgamesh', date: 'Il y a 2 jours' },
    { id: 'v2', title: 'Plan de tournage — Akhenaton', type: 'Document', project: 'Akhenaton', date: 'Il y a 5 jours' },
    { id: 'v3', title: 'Storyboard — Alexandre', type: 'Visuel', project: 'Alexandre', date: 'Il y a 1 semaine' },
  ]
  const recentProductions = [
    { id: 'p1', title: 'Storyboard', project: 'Gilgamesh', type: 'Storyboard', date: '28 juil. 2026' },
    { id: 'p2', title: 'Image concept', project: 'Akhenaton', type: 'Image', date: '25 juil. 2026' },
    { id: 'p3', title: 'Vidéo référence', project: 'Gilgamesh', type: 'Vidéo', date: '20 juil. 2026' },
  ]
  const activity = [
    { id: 'a1', action: 'Logline mise à jour', project: 'Gilgamesh', user: 'Administrateur', date: 'Il y a 1 heure' },
    { id: 'a2', action: 'Nouveau personnage ajouté', project: 'Gilgamesh', user: 'Administrateur', date: 'Il y a 3 heures' },
    { id: 'a3', action: 'Traitement modifié', project: 'Akhenaton', user: 'Administrateur', date: 'Hier' },
    { id: 'a4', action: 'Projet créé', project: 'Alexandre', user: 'Administrateur', date: 'Il y a 5 jours' },
  ]

  return (
    <AppShell>

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Projets cinéma</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Développez vos films, documentaires et récits ambitieux.
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

        <div className="px-8 py-6 space-y-8">
          {/* Reprendre le travail */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Reprendre le travail
              </h2>
              <Link
                href="/cinema/projects"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--interactive)] transition-colors flex items-center gap-1"
              >
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/cinema/projects/${project.slug}`}
                  className="group block rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden hover:border-[var(--border-default)] transition-all duration-[var(--transition-base)] hover:bg-[var(--bg-card-hover)]"
                >
                  {/* Image placeholder */}
                  <div className="aspect-video w-full bg-[var(--bg-elevated)] flex items-center justify-center relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: project.slug === 'gilgamesh'
                          ? 'linear-gradient(135deg, #2a2b2f 0%, #0d0e11 100%)'
                          : project.slug === 'akhenaton'
                          ? 'linear-gradient(135deg, #35363a 0%, #0d0e11 100%)'
                          : 'linear-gradient(135deg, #202126 0%, #0d0e11 100%)',
                      }}
                    />
                    {project.coverImageUrl && (
                      <img src={project.coverImageUrl} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-500" />
                    )}
                    {!project.coverImageUrl && (
                      <Film size={28} className="text-[var(--text-muted)] relative z-10 group-hover:text-[var(--text-secondary)] transition-colors" />
                    )}
                    <div className="absolute bottom-2 left-2 z-20">
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{project.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{FORMAT_LABELS[project.format]}</p>
                    <ProgressBar value={project.completionPercent} showLabel />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-3 gap-6">
            {/* Validations en attente */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Validations en attente
                </h2>
                <button className="text-xs text-[var(--text-muted)] hover:text-[var(--interactive)] transition-colors flex items-center gap-1">
                  Voir tout <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {pendingValidations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors cursor-pointer"
                  >
                    <AlertCircle size={15} className="text-[var(--state-warn)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{v.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{v.project} · {v.date}</p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full shrink-0">
                      {v.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Productions récentes */}
              <div className="flex items-center justify-between mb-4 mt-6">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Productions récentes
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {recentProductions.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3"
                  >
                    <div className="h-16 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] mb-2 flex items-center justify-center">
                      <ImageIcon size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{p.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{p.project} · {p.type}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activité du studio */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Activité du studio
                </h2>
              </div>
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--interactive)] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--text-primary)]">{a.action}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{a.project} · {a.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats rapides */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Projets actifs', value: String(activeProjects.length) },
                  { label: 'En développement', value: String(projects.filter(p => p.status === 'development').length) },
                  { label: 'En pré-prod', value: String(projects.filter(p => p.status === 'pre-production').length) },
                  { label: 'Brouillons', value: String(projects.filter(p => p.status === 'draft').length) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 text-center">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{stat.value}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
