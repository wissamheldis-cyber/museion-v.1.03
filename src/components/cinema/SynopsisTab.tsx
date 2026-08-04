'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Textarea } from '@/components/ui/Input'
import type { Project, Synopsis } from '@/lib/types'

interface SynopsisTabProps {
  project: Project
}

const DEFAULT_SYNOPSIS: Synopsis = {
  short: '',
  long: '',
  beginning: '',
  development: '',
  resolution: '',
}

export function SynopsisTab({ project }: SynopsisTabProps) {
  const { updateSynopsis } = useMuseionStore()
  const [local, setLocal] = useState<Synopsis>(project.synopsis ?? DEFAULT_SYNOPSIS)

  const update = (key: keyof Synopsis, value: string) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    updateSynopsis(project.id, updated)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Synopsis</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Court et long, avec la structure en 3 temps.</p>
      </div>

      <Textarea
        id="synopsis-short"
        label="Synopsis court"
        placeholder="En 3 à 5 phrases, l'essentiel du film."
        value={local.short}
        onChange={(e) => update('short', e.target.value)}
        rows={3}
      />

      <Textarea
        id="synopsis-long"
        label="Synopsis long"
        placeholder="En 10 à 20 phrases, le récit complet avec ses retournements."
        value={local.long}
        onChange={(e) => update('long', e.target.value)}
        rows={6}
      />

      <div className="border-t border-[var(--border-subtle)] pt-5">
        <p className="label-caps mb-4">Structure</p>
        <div className="space-y-4">
          <Textarea
            id="synopsis-beginning"
            label="Début"
            placeholder="Comment ça commence ? Quel est le monde initial ?"
            value={local.beginning}
            onChange={(e) => update('beginning', e.target.value)}
            rows={3}
          />
          <Textarea
            id="synopsis-development"
            label="Développement"
            placeholder="Comment le conflit s'intensifie ? Quels sont les rebondissements ?"
            value={local.development}
            onChange={(e) => update('development', e.target.value)}
            rows={3}
          />
          <Textarea
            id="synopsis-resolution"
            label="Résolution"
            placeholder="Comment ça se termine ? Quelle transformation ?"
            value={local.resolution}
            onChange={(e) => update('resolution', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
