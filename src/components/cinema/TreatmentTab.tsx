'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Textarea } from '@/components/ui/Input'
import type { Project, Treatment } from '@/lib/types'

interface TreatmentTabProps {
  project: Project
}

const DEFAULT_TREATMENT: Treatment = {
  actI: { content: '', keyMoments: [] },
  actII: { content: '', keyMoments: [] },
  actIII: { content: '', keyMoments: [] },
  transformation: '',
  emotionalResolution: '',
}

export function TreatmentTab({ project }: TreatmentTabProps) {
  const { updateTreatment } = useMuseionStore()
  const [local, setLocal] = useState<Treatment>(project.treatment ?? DEFAULT_TREATMENT)

  const updateAct = (act: 'actI' | 'actII' | 'actIII', content: string) => {
    const updated = { ...local, [act]: { ...local[act], content } }
    setLocal(updated)
    updateTreatment(project.id, updated)
  }

  const updateField = (key: 'transformation' | 'emotionalResolution', value: string) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    updateTreatment(project.id, updated)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Traitement</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Structure dramatique en 3 actes.</p>
      </div>

      {/* Acte I */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--interactive-dim)] flex items-center justify-center text-xs font-bold text-[var(--interactive)]">I</div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Acte I — Exposition</h3>
        </div>
        <Textarea
          id="act-i"
          label="Contenu"
          placeholder="Monde ordinaire, incident déclencheur, acceptation du défi."
          value={local.actI.content}
          onChange={(e) => updateAct('actI', e.target.value)}
          rows={4}
        />
        {local.actI.keyMoments.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Moments clés</p>
            <ul className="space-y-1">
              {local.actI.keyMoments.map((m, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--interactive)] mt-0.5">·</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Acte II */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-champagne-dim)] flex items-center justify-center text-xs font-bold text-[var(--accent-champagne)]">II</div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Acte II — Confrontation</h3>
        </div>
        <Textarea
          id="act-ii"
          label="Contenu"
          placeholder="Obstacles croissants, complications, point de non-retour."
          value={local.actII.content}
          onChange={(e) => updateAct('actII', e.target.value)}
          rows={4}
        />
        {local.actII.keyMoments.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Moments clés</p>
            <ul className="space-y-1">
              {local.actII.keyMoments.map((m, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--accent-champagne)] mt-0.5">·</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Acte III */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--state-ok-dim)] flex items-center justify-center text-xs font-bold text-[var(--state-ok)]">III</div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Acte III — Résolution</h3>
        </div>
        <Textarea
          id="act-iii"
          label="Contenu"
          placeholder="Climax, résolution du conflit, nouveau monde."
          value={local.actIII.content}
          onChange={(e) => updateAct('actIII', e.target.value)}
          rows={4}
        />
        {local.actIII.keyMoments.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Moments clés</p>
            <ul className="space-y-1">
              {local.actIII.keyMoments.map((m, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--state-ok)] mt-0.5">·</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transformation et résolution émotionnelle */}
      <Textarea
        id="transformation"
        label="Transformation du personnage"
        placeholder="Qui est-il au début ? Qui est-il à la fin ?"
        value={local.transformation}
        onChange={(e) => updateField('transformation', e.target.value)}
        rows={2}
      />

      <Textarea
        id="emotional-resolution"
        label="Résolution émotionnelle"
        placeholder="Comment le spectateur se sent-il à la sortie ?"
        value={local.emotionalResolution}
        onChange={(e) => updateField('emotionalResolution', e.target.value)}
        rows={2}
      />
    </div>
  )
}
