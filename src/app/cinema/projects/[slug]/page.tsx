'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'
import { DemoProjectPanel } from '@/components/project/DemoProjectPanel'
import { DemoIntroDialog } from '@/components/tour/DemoIntroDialog'
import { StatusBadge, TraceBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { WORKFLOW_STATUS_LABELS, createWorkflow } from '@/lib/workflow'
import { FORMAT_LABELS, cn, formatRelativeDate } from '@/lib/utils'
import {
  FileText,
  PenLine,
  Camera,
  Workflow as WorkflowIcon,
  Film,
  Boxes,
  Monitor,
  Star,
  Library,
  Package,
} from 'lucide-react'

const SECTIONS = (slug: string) => [
  { href: `/cinema/projects/${slug}/development`, label: 'Développement', icon: FileText, desc: 'Vision, logline, scénario, personnages' },
  { href: `/cinema/projects/${slug}/writing-assistant`, label: 'Assistance à l’écriture', icon: PenLine, desc: 'Structure et rythme' },
  { href: `/cinema/projects/${slug}/storyboard`, label: 'Storyboard', icon: Camera, desc: 'Séquences et scènes' },
  { href: `/cinema/projects/${slug}/board`, label: 'Tableau dynamique', icon: WorkflowIcon, desc: 'Graphe des scènes' },
  { href: `/cinema/projects/${slug}/plans`, label: 'Plans & caméra', icon: Film, desc: 'Découpage technique' },
  { href: `/cinema/projects/${slug}/previs`, label: 'Prévis', icon: Boxes, desc: 'Blocking en volume' },
  { href: `/cinema/projects/${slug}/production`, label: 'Production', icon: Monitor, desc: 'File de travaux' },
  { href: `/cinema/projects/${slug}/review`, label: 'Review', icon: Star, desc: 'Validations et commentaires' },
  { href: `/cinema/projects/${slug}/library`, label: 'Bibliothèque', icon: Library, desc: 'Assets du projet' },
  { href: `/cinema/projects/${slug}/deliverables`, label: 'Livrables', icon: Package, desc: 'Exports finaux' },
]

export default function ProjectWorkspacePage() {
  const router = useRouter()
  const { slug, project, traces, scenes, shots, sequences } = useProjectScope()

  if (!project) {
    return (
      <AppShell projectSlug={slug}>
        <ProjectNotFound slug={slug} />
      </AppShell>
    )
  }

  const decisions = traces.filter((t) => t.status === 'decision')
  const hypotheses = traces.filter((t) => t.status === 'hypothesis')
  const questions = traces.filter((t) => t.status === 'open-question')

  return (
    <AppShell projectSlug={slug}>
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{project.title}</h1>
              <StatusBadge status={project.status} />
              <span className="text-sm text-[var(--text-muted)]">
                {FORMAT_LABELS[project.format]}
              </span>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/cinema/projects/${slug}/development`)}
            >
              Reprendre le développement
            </Button>
          </div>
        </div>

        <div className="space-y-8 px-8 py-6">
          {project.isDemo && <DemoProjectPanel project={project} />}

          {/* Vue d'ensemble */}
          <section
            data-tour="project-overview"
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-primary)]">Progression globale</p>
              <span className="metric text-lg text-[var(--text-primary)]">
                {project.completionPercent}%
              </span>
            </div>
            <ProgressBar value={project.completionPercent} color="neutral" className="mb-4" />

            <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-4">
              <Metric label="Séquences" value={sequences.length} />
              <Metric label="Scènes" value={scenes.length} />
              <Metric label="Plans" value={shots.length} />
              <Metric label="Plans validés" value={shots.filter((s) => s.validated).length} />
            </div>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Dernière modification {formatRelativeDate(project.updatedAt)}
            </p>
          </section>

          {/* Workflow */}
          <section data-tour="workflow">
            <h2 className="label-caps mb-3">Phases du projet</h2>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(project.workflow || createWorkflow()).map((step) => (
                <li
                  key={step.id}
                  className={cn(
                    'rounded-[var(--radius-md)] border p-3',
                    step.status === 'done'
                      ? 'border-[var(--state-ok)]/25 bg-[var(--state-ok-dim)]'
                      : step.status === 'in-progress'
                        ? 'border-[var(--interactive-border)] bg-[var(--interactive-dim)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                  )}
                >
                  <p className="label-caps">{String(step.order + 1).padStart(2, '0')}</p>
                  <p className="mt-1 text-[13px] text-[var(--text-primary)]">{step.label}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[11px]',
                      step.status === 'done'
                        ? 'text-[var(--state-ok)]'
                        : 'text-[var(--text-muted)]'
                    )}
                  >
                    {WORKFLOW_STATUS_LABELS[step.status]}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Logline */}
          <section>
            <h2 className="label-caps mb-3">Logline</h2>
            <p className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm italic leading-relaxed text-[var(--text-secondary)]">
              &ldquo;{project.logline || 'Logline non définie'}&rdquo;
            </p>
          </section>

          {/* Sections */}
          <section>
            <h2 className="label-caps mb-4">Sections du projet</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {SECTIONS(slug).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] transition-colors group-hover:bg-[var(--interactive-dim)]">
                    <link.icon size={15} className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{link.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Personnages */}
          {(project.characters || []).length > 0 && (
            <section>
              <h2 className="label-caps mb-4">Personnages ({(project.characters || []).length})</h2>
              <div className="flex flex-wrap gap-3">
                {(project.characters || []).map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)]">
                      {char.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{char.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Traçabilité */}
          <section data-tour="project-traces">
            <h2 className="label-caps mb-4">Décisions, hypothèses et questions</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <TraceColumn title="Décisions" items={decisions} />
              <TraceColumn title="Hypothèses" items={hypotheses} />
              <TraceColumn title="Questions ouvertes" items={questions} />
            </div>
          </section>
        </div>
      </div>

      <DemoIntroDialog project={project} />
    </AppShell>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="metric text-xl text-[var(--text-primary)]">{value}</p>
      <p className="label-caps mt-0.5">{label}</p>
    </div>
  )
}

function TraceColumn({
  title,
  items,
}: {
  title: string
  items: { id: string; status: 'decision' | 'hypothesis' | 'open-question'; content: string }[]
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="label-caps label-caps-strong">{title}</h3>
        <span className="metric text-xs text-[var(--text-muted)]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[12px] text-[var(--text-muted)]">Aucune pour l’instant.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((trace) => (
            <li key={trace.id} className="flex items-start gap-2">
              <TraceBadge status={trace.status} className="mt-0.5 shrink-0" />
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {trace.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
