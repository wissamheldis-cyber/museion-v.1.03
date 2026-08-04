'use client'

import { useState } from 'react'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { AppShell } from '@/components/layout/AppShell'
import { TraceBadge, StatusBadge } from '@/components/ui/Badge'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { VisionTab } from '@/components/cinema/VisionTab'
import { LoglineTab } from '@/components/cinema/LoglineTab'
import { SynopsisTab } from '@/components/cinema/SynopsisTab'
import { TreatmentTab } from '@/components/cinema/TreatmentTab'
import { ScriptTab } from '@/components/cinema/ScriptTab'
import { CharactersTab } from '@/components/cinema/CharactersTab'
import { ArtisticDossierTab } from '@/components/cinema/ArtisticDossierTab'
import { Layers } from 'lucide-react'
import { FORMAT_LABELS } from '@/lib/utils'

type TabId = 'vision' | 'logline' | 'synopsis' | 'treatment' | 'script' | 'characters' | 'dossier'

const TABS: { id: TabId; label: string }[] = [
  { id: 'vision', label: 'Vision' },
  { id: 'logline', label: 'Logline' },
  { id: 'synopsis', label: 'Synopsis' },
  { id: 'treatment', label: 'Traitement' },
  { id: 'script', label: 'Scénario' },
  { id: 'characters', label: 'Personnages' },
  { id: 'dossier', label: 'Dossier artistique' },
]

export default function GilgameshDevelopmentPage() {
  const { slug, project, traces } = useProjectScope()
  const [activeTab, setActiveTab] = useState<TabId>('vision')


  if (!project) {
    return (
      <AppShell projectSlug={slug}>
        <ProjectNotFound slug={slug} />
      </AppShell>
    )
  }

  return (
    <AppShell projectSlug={slug}>

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {project.title} — Développement
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {FORMAT_LABELS[project.format]} · <StatusBadge status={project.status} />
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SaveIndicator />
            </div>
          </div>
        </div>

        <div className="flex gap-0">
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Onglets */}
            <div className="sticky top-[89px] z-10 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] px-8">
              <div className="flex gap-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-[var(--transition-fast)] ${
                      activeTab === tab.id
                        ? 'border-[var(--interactive)] text-[var(--interactive)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu de l'onglet */}
            <div className="px-8 py-6">
              {activeTab === 'vision' && <VisionTab project={project} />}
              {activeTab === 'logline' && <LoglineTab project={project} />}
              {activeTab === 'synopsis' && <SynopsisTab project={project} />}
              {activeTab === 'treatment' && <TreatmentTab project={project} />}
              {activeTab === 'script' && <ScriptTab project={project} />}
              {activeTab === 'characters' && <CharactersTab project={project} />}
              {activeTab === 'dossier' && <ArtisticDossierTab project={project} />}
            </div>
          </div>

          {/* Panneau droit — Carnet du projet */}
          <div className="w-64 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="sticky top-[89px] h-[calc(100vh-89px)] overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={13} className="text-[var(--text-muted)]" />
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                  Carnet du projet
                </p>
              </div>

              {/* Infos rapides */}
              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Long métrage</p>
                  <p className="text-xs text-[var(--text-primary)]">{FORMAT_LABELS[project.format]}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Genre</p>
                  <p className="text-xs text-[var(--text-primary)]">Historique · Épique</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Durée estimée</p>
                  <p className="text-xs text-[var(--text-primary)]">{project.vision?.duration ?? '2h15'}</p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Progression</p>
                    <p className="text-[10px] text-[var(--interactive)] font-medium">{project.completionPercent}%</p>
                  </div>
                  <ProgressBar value={project.completionPercent} color="neutral" />
                </div>
              </div>

              {/* Questions ouvertes */}
              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                  Questions ouvertes
                </p>
                <div className="space-y-2">
                  {traces
                    .filter((t) => t.status === 'open-question')
                    .map((q) => (
                      <div key={q.id} className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-[var(--radius-sm)] p-2.5 border border-[var(--border-subtle)]">
                        <TraceBadge status="open-question" className="mb-1.5" />
                        <p className="leading-relaxed">{q.content}</p>
                      </div>
                    ))}
                  {traces.filter((t) => t.status === 'open-question').length === 0 && (
                    <p className="text-xs text-[var(--text-muted)]">Aucune question ouverte</p>
                  )}
                </div>
              </div>

              {/* Décisions */}
              <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                  Décisions validées
                </p>
                <div className="space-y-2">
                  {traces
                    .filter((t) => t.status === 'decision')
                    .map((d) => (
                      <div key={d.id} className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-[var(--radius-sm)] p-2.5 border border-[var(--border-subtle)]">
                        <TraceBadge status="decision" className="mb-1.5" />
                        <p className="leading-relaxed">{d.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
