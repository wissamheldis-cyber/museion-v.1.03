'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronRight, Copy, Pencil, Send, Trash2, Wand2, X } from 'lucide-react'
import type {
  Asset,
  CameraMovement,
  Sequence,
  Shot,
  ShotType,
  StoryboardScene,
} from '@/lib/types-storyboard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { shotThumbUrl } from '@/components/storyboard/sceneVisual'
import {
  CAMERAS,
  CAMERA_ANGLES,
  CAMERA_HEIGHTS,
  CAMERA_MOVEMENTS,
  CAMERA_MOVEMENT_LABELS,
  FRAME_RATES,
  KNOWLEDGE_DISCLAIMER,
  LENSES,
  RATIOS,
  SHOT_TYPES,
  SHOT_TYPE_LABELS,
  getCamera,
} from '@/knowledge/camera'
import { LIGHTING_RECIPES, getLightingRecipe } from '@/knowledge/lighting'
import { DECOR_REFERENCES, resolveDecor } from '@/knowledge/decors'

interface ShotInspectorProps {
  shot: Shot | undefined
  scene: StoryboardScene | undefined
  sequence: Sequence | undefined
  assets: Asset[]
  projectSlug: string
  onUpdate: (patch: Partial<Shot>) => void
  onToggleValidated: () => void
  onDuplicate: () => void
  onDelete: () => void
  onOpenPrompt: () => void
  onClose: () => void
}

export function ShotInspector({
  shot,
  scene,
  sequence,
  assets,
  projectSlug,
  onUpdate,
  onToggleValidated,
  onDuplicate,
  onDelete,
  onOpenPrompt,
  onClose,
}: ShotInspectorProps) {
  const [editing, setEditing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!shot) {
    return (
      <aside className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Sélectionnez un plan pour afficher ses réglages.
        </p>
      </aside>
    )
  }

  const camera = getCamera(shot.camera)
  const lighting = getLightingRecipe(shot.lighting)
  const decor = resolveDecor(shot.decor)

  return (
    <aside className="flex h-full flex-col overflow-hidden" aria-label="Inspecteur de plan">
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Plan sélectionné</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            aria-label={editing ? 'Terminer l’édition du plan' : 'Éditer le plan'}
            title={editing ? 'Terminer l’édition' : 'Éditer le plan'}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’inspecteur de plan"
            title="Fermer l’inspecteur"
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Plan {String(shot.number).padStart(2, '0')}
          </h3>
          <Badge variant={shot.validated ? 'ok' : 'ghost'}>
            {shot.validated ? 'Validé' : 'À valider'}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {sequence ? `Séquence ${String(sequence.number).padStart(2, '0')}` : 'Séquence inconnue'} ·{' '}
          {SHOT_TYPE_LABELS[shot.type]}
          {scene ? ` · Scène ${String(scene.number).padStart(2, '0')}` : ''}
        </p>

        <PreviewFrame
          url={shotThumbUrl(shot, scene, assets)}
          alt={`Prévisualisation du plan ${shot.number}`}
          className="mt-3 aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
        />

        {/* Réglages caméra */}
        <Section title="Réglages caméra">
          {editing ? (
            <div className="space-y-2">
              <SelectField
                label="Type de plan"
                value={shot.type}
                onChange={(value) => onUpdate({ type: value as ShotType })}
                options={SHOT_TYPES.map((s) => ({ value: s.id, label: s.label }))}
              />
              <SelectField
                label="Caméra"
                value={shot.camera}
                onChange={(value) => {
                  const entry = getCamera(value)
                  onUpdate({ camera: value, sensor: entry?.sensor ?? shot.sensor })
                }}
                options={CAMERAS.map((c) => ({ value: c.name, label: c.name }))}
              />
              <SelectField
                label="Focale"
                value={shot.focal}
                onChange={(value) => onUpdate({ focal: value })}
                options={FOCAL_OPTIONS.map((f) => ({ value: f, label: f }))}
              />
              <SelectField
                label="Format"
                value={shot.ratio}
                onChange={(value) => onUpdate({ ratio: value })}
                options={RATIOS.map((r) => ({ value: r, label: r }))}
              />
              <SelectField
                label="Mouvement"
                value={shot.movement}
                onChange={(value) => onUpdate({ movement: value as CameraMovement })}
                options={CAMERA_MOVEMENTS.map((m) => ({ value: m.id, label: m.label }))}
              />
              <SelectField
                label="Angle"
                value={shot.angle}
                onChange={(value) => onUpdate({ angle: value })}
                options={CAMERA_ANGLES.map((a) => ({ value: a, label: a }))}
              />
              <SelectField
                label="Hauteur caméra"
                value={shot.height}
                onChange={(value) => onUpdate({ height: value })}
                options={CAMERA_HEIGHTS.map((h) => ({ value: h, label: h }))}
              />
              <TextField
                label="Filtre"
                value={shot.filter}
                onChange={(value) => onUpdate({ filter: value })}
              />
              <NumberField
                label="Durée (s)"
                value={shot.duration}
                step={0.1}
                onChange={(value) => onUpdate({ duration: value })}
              />
              <SelectField
                label="Cadence"
                value={String(shot.frameRate)}
                onChange={(value) => onUpdate({ frameRate: Number(value) })}
                options={FRAME_RATES.map((f) => ({ value: String(f), label: `${f} i/s` }))}
              />
            </div>
          ) : (
            <dl className="text-xs">
              <Row label="Caméra" value={shot.camera} />
              <Row label="Capteur" value={shot.sensor} />
              <Row label="Focale" value={shot.focal} />
              <Row label="Format" value={shot.ratio} />
              <Row label="Mouvement" value={CAMERA_MOVEMENT_LABELS[shot.movement]} />
              <Row label="Angle" value={shot.angle} />
              <Row label="Hauteur caméra" value={shot.height} />
              <Row label="Filtre" value={shot.filter} />
              <Row label="Durée" value={`${shot.duration.toString().replace('.', ',')} s`} />
              <Row label="Cadence" value={`${shot.frameRate} i/s`} last />
            </dl>
          )}
        </Section>

        {/* Fiche technique locale */}
        {camera && (
          <section className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
            <button
              type="button"
              onClick={() => setSheetOpen((open) => !open)}
              aria-expanded={sheetOpen}
              className="flex w-full items-center gap-1.5 text-left text-xs font-medium text-[var(--text-primary)]"
            >
              {sheetOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Fiche technique — {camera.name}
            </button>

            {sheetOpen && (
              <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                <p>
                  <span className="text-[var(--text-muted)]">Capteur :</span> {camera.sensor}
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Résolution :</span> {camera.resolution}
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Latitude :</span> {camera.dynamicRange}
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Ratios :</span>{' '}
                  {camera.ratios.join(' · ')}
                </p>
                <div>
                  <p className="text-[var(--text-muted)]">Usages</p>
                  <ul className="mt-0.5 list-disc pl-4">
                    {camera.uses.map((use) => (
                      <li key={use}>{use}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Limites</p>
                  <ul className="mt-0.5 list-disc pl-4">
                    {camera.limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                </div>
                <p className="border-t border-[var(--border-subtle)] pt-2 text-[10px] text-[var(--text-muted)]">
                  {KNOWLEDGE_DISCLAIMER}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Lumière, décor, continuité */}
        <Section title="Lumière, décor et continuité">
          {editing ? (
            <div className="space-y-2">
              <SelectField
                label="Lumière"
                value={shot.lighting}
                onChange={(value) => onUpdate({ lighting: value })}
                options={LIGHTING_RECIPES.map((l) => ({ value: l.id, label: l.name }))}
              />
              <SelectField
                label="Décor"
                value={shot.decor}
                onChange={(value) => onUpdate({ decor: value })}
                options={[
                  { value: shot.decor, label: shot.decor },
                  ...DECOR_REFERENCES.filter((d) => d.name !== shot.decor).map((d) => ({
                    value: d.name,
                    label: d.name,
                  })),
                ]}
              />
              <TextField
                label="Continuité"
                value={shot.continuity}
                onChange={(value) => onUpdate({ continuity: value })}
              />
              <TextAreaField
                label="Risques"
                value={shot.risks}
                onChange={(value) => onUpdate({ risks: value })}
              />
              <TextAreaField
                label="Références (une par ligne)"
                value={shot.references.join('\n')}
                onChange={(value) =>
                  onUpdate({ references: value.split('\n').filter((line) => line.trim() !== '') })
                }
              />
            </div>
          ) : (
            <dl className="text-xs">
              <Row label="Lumière" value={lighting?.name ?? shot.lighting} />
              <Row label="Décor" value={decor?.name ?? shot.decor} />
              <Row label="Continuité" value={shot.continuity} />
              <Row label="Risques" value={shot.risks || '—'} />
              <Row
                label="Références"
                value={shot.references.length > 0 ? shot.references.join(' · ') : '—'}
                last
              />
            </dl>
          )}

          {lighting && !editing && (
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              {lighting.technicalNotes}
            </p>
          )}
          {decor && !editing && (
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Continuité décor : {decor.continuity}
            </p>
          )}
        </Section>

        {/* Notes de réalisation */}
        <Section title="Notes de réalisation">
          {editing ? (
            <TextAreaField
              label="Notes"
              value={shot.notes}
              rows={5}
              onChange={(value) => onUpdate({ notes: value })}
            />
          ) : (
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {shot.notes || '—'}
            </p>
          )}
        </Section>
      </div>

      <div className="border-t border-[var(--border-subtle)] px-4 py-3">
        <Button variant="secondary" size="md" className="w-full" onClick={onOpenPrompt}>
          <Wand2 size={14} />
          Prévisualisation du prompt
        </Button>

        <Button
          variant={shot.validated ? 'secondary' : 'primary'}
          size="md"
          className="mt-2 w-full"
          onClick={onToggleValidated}
        >
          <Check size={14} />
          {shot.validated ? 'Annuler la validation' : 'Valider le plan'}
        </Button>

        <Link
          href={`/cinema/projects/${projectSlug}/production`}
          title="File de production — en construction (Sprint 3)"
          className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <Send size={14} />
          Envoyer en production (Sprint 3)
        </Link>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <Copy size={12} />
            Dupliquer
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] py-2 text-xs text-[var(--state-danger)] transition-colors hover:bg-[var(--state-danger-dim)]"
          >
            <Trash2 size={12} />
            Supprimer
          </button>
        </div>
      </div>
    </aside>
  )
}

const FOCAL_OPTIONS = [
  '14 mm',
  '18 mm',
  '21 mm',
  '24 mm',
  '28 mm',
  '32 mm',
  '35 mm',
  '40 mm',
  '50 mm',
  '65 mm',
  '75 mm',
  '85 mm',
  '100 mm',
  '100 mm macro',
  '135 mm',
  '180 mm',
]

/** Optiques de la base locale, proposées en légende du champ focale. */
export const LENS_HINTS = LENSES.map((lens) => `${lens.name} — ${lens.focalLength}`)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="mb-2 label-caps">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-1.5 ${
        last ? '' : 'border-b border-[var(--border-subtle)]'
      }`}
    >
      <dt className="shrink-0 text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate text-right text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

const fieldClass =
  'w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--interactive)] focus:outline-none'

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <input
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string
  value: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <input
        type="number"
        step={step}
        min={0.1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) || 0.1)}
        className={fieldClass}
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string
  value: string
  rows?: number
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} resize-none`}
      />
    </label>
  )
}
