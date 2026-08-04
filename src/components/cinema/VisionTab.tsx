'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Textarea } from '@/components/ui/Input'
import { TraceBadge } from '@/components/ui/Badge'
import type { Project } from '@/lib/types'

interface VisionTabProps {
  project: Project
}

const VISION_FIELDS: { key: keyof NonNullable<Project['vision']>; label: string; placeholder: string; rows?: number }[] = [
  { key: 'promise', label: 'Promesse', placeholder: "Qu'est-ce que ce film promet au spectateur ?", rows: 2 },
  { key: 'intention', label: 'Intention', placeholder: 'Pourquoi faire ce film maintenant ?', rows: 2 },
  { key: 'theme', label: 'Theme', placeholder: "Quelle est l'idee centrale ?", rows: 2 },
  { key: 'world', label: 'Monde', placeholder: "Decrivez l'univers du film.", rows: 2 },
  { key: 'conflict', label: 'Conflit', placeholder: 'Quel est le conflit moteur ?', rows: 2 },
  { key: 'arc', label: 'Arc', placeholder: 'Comment le personnage evolue-t-il ?', rows: 2 },
  { key: 'tone', label: 'Ton', placeholder: 'Comment le film sonne-t-il ?', rows: 1 },
  { key: 'audience', label: 'Public', placeholder: "A qui ce film s'adresse-t-il ?", rows: 1 },
  { key: 'duration', label: 'Duree estimee', placeholder: 'Ex : 2h15', rows: 1 },
]

export function VisionTab({ project }: VisionTabProps) {
  const { updateVision } = useMuseionStore()
  const [localVision, setLocalVision] = useState(project.vision ?? {
    promise: '', intention: '', theme: '', world: '', conflict: '', arc: '', tone: '', audience: '', duration: '', references: [],
  })

  const handleChange = (key: keyof NonNullable<Project['vision']>, value: string) => {
    const updated = { ...localVision, [key]: value }
    setLocalVision(updated)
    updateVision(project.id, updated)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Vision du projet</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Les fondements narratifs et artistiques.</p>
      </div>

      {project.traces.filter((t) => t.status === 'decision').length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-green-500/5 border border-green-500/15">
          <TraceBadge status="decision" className="shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-secondary)]">
            {project.traces.find((t) => t.status === 'decision')?.content}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {VISION_FIELDS.map(({ key, label, placeholder, rows }) => {
          if (key === 'references') return null
          return (
            <Textarea
              key={key}
              id={`vision-${key}`}
              label={label}
              placeholder={placeholder}
              value={String(localVision[key] ?? '')}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={rows ?? 2}
            />
          )
        })}
      </div>
    </div>
  )
}
