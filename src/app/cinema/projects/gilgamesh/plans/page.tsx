'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LayoutGrid,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Rows3,
  Search,
} from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'
import { AppShell } from '@/components/layout/AppShell'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ShotCard } from '@/components/plans/ShotCard'
import { ShotInspector } from '@/components/plans/ShotInspector'
import { PromptComposer } from '@/components/plans/PromptComposer'
import { CAMERAS, CAMERA_MOVEMENT_LABELS, SHOT_TYPE_LABELS } from '@/knowledge/camera'
import { getLightingRecipe } from '@/knowledge/lighting'
import type { Shot } from '@/lib/types-storyboard'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'table'

export default function PlansPage() {

  const projects = useMuseionStore((s) => s.projects)
  const sequences = useMuseionStore((s) => s.sequences)
  const scenes = useMuseionStore((s) => s.scenes)
  const shots = useMuseionStore((s) => s.shots)
  const assets = useMuseionStore((s) => s.assets)
  const selectedShotId = useMuseionStore((s) => s.selectedShotId)

  const selectShot = useMuseionStore((s) => s.selectShot)
  const addShot = useMuseionStore((s) => s.addShot)
  const updateShot = useMuseionStore((s) => s.updateShot)
  const removeShot = useMuseionStore((s) => s.removeShot)
  const duplicateShot = useMuseionStore((s) => s.duplicateShot)
  const setShotValidated = useMuseionStore((s) => s.setShotValidated)

  const [query, setQuery] = useState('')
  const [sequenceFilter, setSequenceFilter] = useState('all')
  const [placeFilter, setPlaceFilter] = useState<'all' | 'INT' | 'EXT'>('all')
  const [cameraFilter, setCameraFilter] = useState('all')
  const [validatedFilter, setValidatedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [promptOpen, setPromptOpen] = useState(false)
  const [shotToDelete, setShotToDelete] = useState<Shot | null>(null)

  useEffect(() => {
    const apply = () => setInspectorOpen(window.innerWidth >= 1280)
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // Arrivée depuis le storyboard : « Passer en plan détaillé »
  useEffect(() => {
    const sceneId = new URLSearchParams(window.location.search).get('scene')
    if (!sceneId) return
    const firstShot = shots.find((shot) => shot.sceneId === sceneId)
    if (firstShot) selectShot(firstShot.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const project = projects.find((p) => p.slug === 'gilgamesh')

  const sceneById = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes])
  const sequenceById = useMemo(() => new Map(sequences.map((s) => [s.id, s])), [sequences])

  const visibleShots = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return shots
      .filter((shot) => {
        const scene = sceneById.get(shot.sceneId)
        if (sequenceFilter !== 'all' && scene?.sequenceId !== sequenceFilter) return false
        if (placeFilter !== 'all') {
          const isInterior = shot.decor.toLowerCase().startsWith('int')
          if (placeFilter === 'INT' && !isInterior) return false
          if (placeFilter === 'EXT' && isInterior) return false
        }
        if (cameraFilter !== 'all' && shot.camera !== cameraFilter) return false
        if (validatedFilter === 'yes' && !shot.validated) return false
        if (validatedFilter === 'no' && shot.validated) return false
        if (needle) {
          const haystack = [
            `plan ${shot.number}`,
            SHOT_TYPE_LABELS[shot.type],
            shot.camera,
            shot.focal,
            shot.decor,
            shot.notes,
            scene?.title ?? '',
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => a.number - b.number)
  }, [shots, sceneById, sequenceFilter, placeFilter, cameraFilter, validatedFilter, query])

  const selectedShot = shots.find((s) => s.id === selectedShotId)
  const selectedScene = selectedShot ? sceneById.get(selectedShot.sceneId) : undefined
  const selectedSequence = selectedScene ? sequenceById.get(selectedScene.sequenceId) : undefined

  if (!project) return null

  const handleAddShot = () => {
    const anchorScene = selectedScene ?? scenes[0]
    if (!anchorScene) return
    addShot(anchorScene.id)
  }

  return (
    <AppShell projectSlug="gilgamesh">

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 px-6 py-4 backdrop-blur-xl">

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Plans &amp; caméra</h1>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Affinez chaque plan avant la production.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SaveIndicator />
              <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
                <ViewToggle
                  active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  icon={LayoutGrid}
                  label="Vue cartes"
                />
                <ViewToggle
                  active={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  icon={Rows3}
                  label="Vue tableau"
                />
              </div>
              <button
                type="button"
                onClick={() => setInspectorOpen((open) => !open)}
                aria-label={inspectorOpen ? 'Replier l’inspecteur' : 'Afficher l’inspecteur'}
                title={inspectorOpen ? 'Replier l’inspecteur' : 'Afficher l’inspecteur'}
                aria-pressed={inspectorOpen}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                {inspectorOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Séquence"
              value={sequenceFilter}
              onChange={setSequenceFilter}
              options={[
                { value: 'all', label: 'Toutes les séquences' },
                ...sequences.map((s) => ({
                  value: s.id,
                  label: `Séq. ${String(s.number).padStart(2, '0')} — ${s.title}`,
                })),
              ]}
            />
            <FilterSelect
              label="Intérieur / Extérieur"
              value={placeFilter}
              onChange={(value) => setPlaceFilter(value as 'all' | 'INT' | 'EXT')}
              options={[
                { value: 'all', label: 'Intérieur / Extérieur' },
                { value: 'INT', label: 'Intérieur' },
                { value: 'EXT', label: 'Extérieur' },
              ]}
            />
            <FilterSelect
              label="Caméra"
              value={cameraFilter}
              onChange={setCameraFilter}
              options={[
                { value: 'all', label: 'Toutes les caméras' },
                ...CAMERAS.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
            <FilterSelect
              label="Validé"
              value={validatedFilter}
              onChange={(value) => setValidatedFilter(value as 'all' | 'yes' | 'no')}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'yes', label: 'Validés' },
                { value: 'no', label: 'À valider' },
              ]}
            />

            <div className="relative min-w-[220px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un plan…"
                aria-label="Rechercher un plan"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--interactive)] focus:outline-none"
              />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              {visibleShots.length} plan{visibleShots.length > 1 ? 's' : ''} sur {shots.length}
            </p>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {visibleShots.map((shot) => (
                  <ShotCard
                    key={shot.id}
                    shot={shot}
                    scene={sceneById.get(shot.sceneId)}
                    sequence={sequenceById.get(sceneById.get(shot.sceneId)?.sequenceId ?? '')}
                    assets={assets}
                    selected={shot.id === selectedShotId}
                    onSelect={() => selectShot(shot.id)}
                    onToggleValidated={() => setShotValidated(shot.id, !shot.validated)}
                    onDuplicate={() => duplicateShot(shot.id)}
                    onDelete={() => setShotToDelete(shot)}
                  />
                ))}

                <button
                  type="button"
                  onClick={handleAddShot}
                  className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--interactive)] hover:text-[var(--text-primary)]"
                >
                  <Plus size={18} />
                  Ajouter un plan
                </button>
              </div>
            ) : (
              <ShotTable
                shots={visibleShots}
                selectedShotId={selectedShotId}
                onSelect={selectShot}
                sceneTitle={(sceneId) => sceneById.get(sceneId)?.title ?? '—'}
                onAdd={handleAddShot}
              />
            )}
          </div>

          {inspectorOpen && (
            <div className="w-[340px] shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <ShotInspector
                shot={selectedShot}
                scene={selectedScene}
                sequence={selectedSequence}
                assets={assets}
                projectSlug="gilgamesh"
                onUpdate={(patch) => selectedShot && updateShot(selectedShot.id, patch)}
                onToggleValidated={() =>
                  selectedShot && setShotValidated(selectedShot.id, !selectedShot.validated)
                }
                onDuplicate={() => selectedShot && duplicateShot(selectedShot.id)}
                onDelete={() => selectedShot && setShotToDelete(selectedShot)}
                onOpenPrompt={() => setPromptOpen(true)}
                onClose={() => setInspectorOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      <PromptComposer
        open={promptOpen}
        shot={selectedShot}
        scene={selectedScene}
        onClose={() => setPromptOpen(false)}
      />

      <ConfirmDialog
        open={shotToDelete !== null}
        title="Supprimer le plan"
        message={`Le plan ${shotToDelete ? String(shotToDelete.number).padStart(2, '0') : ''} sera supprimé du projet. La scène et son storyboard ne sont pas affectés.`}
        confirmLabel="Supprimer le plan"
        onCancel={() => setShotToDelete(null)}
        onConfirm={() => {
          if (shotToDelete) removeShot(shotToDelete.id)
          setShotToDelete(null)
        }}
      />
    </AppShell>
  )
}

function ShotTable({
  shots,
  selectedShotId,
  onSelect,
  sceneTitle,
  onAdd,
}: {
  shots: Shot[]
  selectedShotId: string | null
  onSelect: (shotId: string) => void
  sceneTitle: (sceneId: string) => string
  onAdd: () => void
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)]">
          <tr>
            {['Plan', 'Scène', 'Type', 'Focale', 'Caméra', 'Mouvement', 'Durée', 'Lumière', 'Statut'].map(
              (header) => (
                <th key={header} className="px-3 py-2 font-medium">
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {shots.map((shot) => (
            <tr
              key={shot.id}
              onClick={() => onSelect(shot.id)}
              className={cn(
                'cursor-pointer border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-card-hover)]',
                shot.id === selectedShotId && 'bg-[var(--interactive-dim)]'
              )}
            >
              <td className="px-3 py-2 text-[var(--text-primary)]">
                {String(shot.number).padStart(2, '0')}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{sceneTitle(shot.sceneId)}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{SHOT_TYPE_LABELS[shot.type]}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{shot.focal}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{shot.camera}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {CAMERA_MOVEMENT_LABELS[shot.movement]}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {shot.duration.toString().replace('.', ',')} s
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {getLightingRecipe(shot.lighting)?.name ?? shot.lighting}
              </td>
              <td className="px-3 py-2">
                <span className={shot.validated ? 'text-[var(--state-ok)]' : 'text-[var(--text-muted)]'}>
                  {shot.validated ? 'Validé' : 'À valider'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-2 border-t border-dashed border-[var(--border-default)] py-3 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Plus size={14} />
        Ajouter un plan
      </button>
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors',
        active
          ? 'bg-[var(--interactive-dim)] text-[var(--interactive)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function FilterSelect({
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
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--interactive)] focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
