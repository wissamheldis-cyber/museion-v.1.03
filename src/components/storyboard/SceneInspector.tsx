'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  FileText,
  MapPin,
  Sparkles,
  Trash2,
  Wand2,
  Camera,
  Pencil,
  Check,
  Info,
} from 'lucide-react'
import type { Asset, SceneMoment, StoryboardScene } from '@/lib/types-storyboard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { SHOT_TYPES, SHOT_TYPE_LABELS } from '@/knowledge/camera'
import { LIGHTING_RECIPES } from '@/knowledge/lighting'
import { SIMULATION_DISCLAIMER } from '@/providers/preview'
import { ASSET_STATUS_LABELS_FEMININE } from '@/lib/assetLifecycle'
import { formatTimecode, sceneThumbUrl } from './sceneVisual'

const MOMENTS: SceneMoment[] = ['Aube', 'Jour', 'Crépuscule', 'Nuit']

interface SceneInspectorProps {
  scene: StoryboardScene | undefined
  assets: Asset[]
  projectSlug: string
  generating: boolean
  lastPreviewAssetId: string | null
  onUpdate: (patch: Partial<StoryboardScene>) => void
  onGeneratePreview: () => void
  onDelete: () => void
}

export function SceneInspector({
  scene,
  assets,
  projectSlug,
  generating,
  lastPreviewAssetId,
  onUpdate,
  onGeneratePreview,
  onDelete,
}: SceneInspectorProps) {
  const [editing, setEditing] = useState(false)

  if (!scene) {
    return (
      <aside className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Sélectionnez une scène pour afficher son inspecteur.
        </p>
      </aside>
    )
  }

  const attachedAsset = scene.assetId ? assets.find((a) => a.id === scene.assetId) : undefined
  const lastPreview = lastPreviewAssetId
    ? assets.find((a) => a.id === lastPreviewAssetId)
    : undefined

  return (
    <aside className="flex h-full flex-col overflow-hidden" aria-label="Inspecteur de scène">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Scène sélectionnée</h2>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          aria-label={editing ? 'Terminer l’édition de la scène' : 'Éditer la scène'}
          title={editing ? 'Terminer l’édition' : 'Éditer la scène'}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          {editing ? <Check size={14} /> : <Pencil size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <PreviewFrame
          url={sceneThumbUrl(scene, assets)}
          alt={`Miniature de la scène ${scene.number}`}
          className="aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
        >
          <span className="absolute left-2 top-2 rounded-[var(--radius-sm)] bg-[var(--accent-blue-dim)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent-blue)]">
            {String(scene.number).padStart(2, '0')}
          </span>
        </PreviewFrame>

        {editing ? (
          <input
            value={scene.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            aria-label="Titre de la scène"
            className="mt-4 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-base font-semibold text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
        ) : (
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{scene.title}</h3>
        )}

        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Durée estimée {formatTimecode(scene.duration)}
        </p>

        {attachedAsset && (
          <div className="mt-3">
            <Badge variant={attachedAsset.status === 'ephemeral' ? 'amber' : 'green'}>
              Miniature {ASSET_STATUS_LABELS_FEMININE[attachedAsset.status]}
            </Badge>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <Field icon={FileText} label="Description du plan">
            {editing ? (
              <textarea
                value={scene.description}
                onChange={(event) => onUpdate({ description: event.target.value })}
                rows={3}
                aria-label="Description du plan"
                className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
              />
            ) : (
              <p>{scene.description || '—'}</p>
            )}
          </Field>

          <Field icon={Sparkles} label="Émotion">
            {editing ? (
              <TextField
                value={scene.emotion}
                label="Émotion"
                onChange={(value) => onUpdate({ emotion: value })}
              />
            ) : (
              <p>{scene.emotion}</p>
            )}
          </Field>

          <Field icon={MapPin} label="Lieu">
            {editing ? (
              <TextField
                value={scene.location}
                label="Lieu"
                onChange={(value) => onUpdate({ location: value })}
              />
            ) : (
              <p>{scene.location}</p>
            )}
          </Field>

          <Field icon={Clock} label="Moment">
            {editing ? (
              <select
                value={scene.moment}
                onChange={(event) => onUpdate({ moment: event.target.value as SceneMoment })}
                aria-label="Moment de la journée"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
              >
                {MOMENTS.map((moment) => (
                  <option key={moment} value={moment}>
                    {moment}
                  </option>
                ))}
              </select>
            ) : (
              <p>{scene.moment}</p>
            )}
          </Field>

          <Field icon={Camera} label="Plan principal">
            {editing ? (
              <select
                value={scene.mainShotType ?? 'wide'}
                onChange={(event) =>
                  onUpdate({ mainShotType: event.target.value as StoryboardScene['mainShotType'] })
                }
                aria-label="Type de plan principal"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
              >
                {SHOT_TYPES.map((shotType) => (
                  <option key={shotType.id} value={shotType.id}>
                    {shotType.label}
                  </option>
                ))}
              </select>
            ) : (
              <p>{scene.mainShotType ? SHOT_TYPE_LABELS[scene.mainShotType] : '—'}</p>
            )}
          </Field>

          {editing && (
            <>
              <Field icon={Wand2} label="Lumière">
                <select
                  value={scene.lighting}
                  onChange={(event) => onUpdate({ lighting: event.target.value })}
                  aria-label="Recette de lumière"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                >
                  {LIGHTING_RECIPES.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field icon={Clock} label="Durée (secondes)">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={scene.duration}
                  onChange={(event) => onUpdate({ duration: Number(event.target.value) || 1 })}
                  aria-label="Durée de la scène en secondes"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                />
              </Field>
            </>
          )}

          <Field icon={FileText} label="Intention">
            {editing ? (
              <TextField
                value={scene.intention}
                label="Intention"
                onChange={(value) => onUpdate({ intention: value })}
              />
            ) : (
              <p>{scene.intention}</p>
            )}
          </Field>
        </div>

        {lastPreview && (
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--accent-champagne)]/25 bg-[var(--accent-champagne-dim)] p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-champagne)]">
              <Info size={12} />
              {SIMULATION_DISCLAIMER}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
              Modèle simulé : {lastPreview.simulatedModel}. Statut{' '}
              {ASSET_STATUS_LABELS_FEMININE[lastPreview.status]} — expire dans 14 jours si
              aucune validation humaine n’intervient.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Actions
        </p>
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={onGeneratePreview}
          disabled={generating}
        >
          <Wand2 size={14} />
          {generating ? 'Composition locale…' : 'Générer une prévisualisation'}
        </Button>
        <Link
          href={`/cinema/projects/${projectSlug}/plans?scene=${scene.id}`}
          className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
        >
          <Camera size={14} />
          Passer en plan détaillé
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 size={14} />
          Supprimer la scène
        </button>
      </div>
    </aside>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
        <div className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
      </div>
    </div>
  )
}

function TextField({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  return (
    <input
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
    />
  )
}
