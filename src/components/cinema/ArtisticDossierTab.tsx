'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Textarea } from '@/components/ui/Input'
import type { Project, ArtisticDossier } from '@/lib/types'

interface ArtisticDossierTabProps {
  project: Project
}

const DEFAULT_DOSSIER: ArtisticDossier = {
  intentionNote: '',
  visualDirection: '',
  colorPalette: '',
  lighting: '',
  sets: '',
  costumes: '',
  staging: '',
  cinemaReferences: '',
  sound: '',
  music: '',
  images: [],
}

const DOSSIER_FIELDS: { key: keyof Omit<ArtisticDossier, 'images'>; label: string; placeholder: string; rows?: number }[] = [
  { key: 'intentionNote', label: "Note d'intention", placeholder: "Pourquoi ce film ? Qu'est-ce qu'il veut dire ?", rows: 4 },
  { key: 'visualDirection', label: 'Direction visuelle', placeholder: "Quel est le langage visuel du film ? Références cinématographiques.", rows: 3 },
  { key: 'colorPalette', label: 'Palette de couleurs', placeholder: 'Décrivez la palette : tons, saturation, évolution chromatique.', rows: 2 },
  { key: 'lighting', label: 'Lumière', placeholder: 'Type de lumière, sources, ambiances.', rows: 2 },
  { key: 'sets', label: 'Décors', placeholder: 'Lieux de tournage, construction de décors, ambiances.', rows: 3 },
  { key: 'costumes', label: 'Costumes', placeholder: 'Parti pris costume, matières, évolution.', rows: 2 },
  { key: 'staging', label: 'Mise en scène', placeholder: "Mouvement de caméra, plans types, rapport à l'espace.", rows: 3 },
  { key: 'cinemaReferences', label: 'References cinema', placeholder: "Films de reference et ce qu'ils apportent.", rows: 3 },
  { key: 'sound', label: 'Son', placeholder: 'Son direct, ambiances, textures sonores.', rows: 2 },
  { key: 'music', label: 'Musique', placeholder: 'Style musical, instruments, compositeur envisagé.', rows: 2 },
]

export function ArtisticDossierTab({ project }: ArtisticDossierTabProps) {
  const { updateArtisticDossier } = useMuseionStore()
  const [local, setLocal] = useState<ArtisticDossier>(project.artisticDossier ?? DEFAULT_DOSSIER)

  const update = (key: keyof ArtisticDossier, value: string) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    updateArtisticDossier(project.id, updated)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Dossier artistique</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          La vision esthétique complète du projet.
        </p>
      </div>

      {/* Sections */}
      {DOSSIER_FIELDS.map(({ key, label, placeholder, rows }) => (
        <Textarea
          key={key}
          id={`dossier-${key}`}
          label={label}
          placeholder={placeholder}
          value={String(local[key] ?? '')}
          onChange={(e) => update(key, e.target.value)}
          rows={rows ?? 2}
        />
      ))}

      {/* Import images */}
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Références visuelles
        </p>
        <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Import local d&apos;images</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Disponible au Sprint 2</p>
        </div>
        {local.images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {local.images.map((img) => (
              <div key={img.id} className="aspect-video rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                {img.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
