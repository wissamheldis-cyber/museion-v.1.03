'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  Archive,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react'
import { useMuseionStore } from '@/store/museionStore'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { Button } from '@/components/ui/Button'
import { ClassicView } from '@/components/storyboard/ClassicView'
import { DynamicCanvas } from '@/components/storyboard/DynamicCanvas'
import { SceneInspector } from '@/components/storyboard/SceneInspector'
import { AssetBin } from '@/components/storyboard/AssetBin'
import { TemporaryArchives } from '@/components/storyboard/TemporaryArchives'
import { activePreviewProvider } from '@/providers/preview'
import type { ProjectScope } from '@/components/layout/useProjectFromRoute'
import type { SceneMoment, StoryboardScene } from '@/lib/types-storyboard'
import { cn } from '@/lib/utils'

const MOMENT_FILTERS: (SceneMoment | 'all')[] = ['all', 'Aube', 'Jour', 'Crépuscule', 'Nuit']

interface StoryboardWorkspaceProps {
  scope: ProjectScope
  view: 'classic' | 'board'
}

/**
 * Implémentation unique du storyboard, partagée par la vue classique
 * (/storyboard) et le tableau dynamique (/board). Les deux lisent
 * exactement les mêmes données, filtrées sur le projet de la route.
 */
export function StoryboardWorkspace({ scope, view }: StoryboardWorkspaceProps) {
  const { slug, project, sequences, scenes, assets, edges } = scope

  const selectedSceneId = useMuseionStore((s) => s.selectedSceneId)
  const canvasViewport = useMuseionStore((s) => s.canvasViewport)
  const selectScene = useMuseionStore((s) => s.selectScene)
  const addSequence = useMuseionStore((s) => s.addSequence)
  const addScene = useMuseionStore((s) => s.addScene)
  const updateScene = useMuseionStore((s) => s.updateScene)
  const removeScene = useMuseionStore((s) => s.removeScene)
  const duplicateScene = useMuseionStore((s) => s.duplicateScene)
  const moveSceneToSequence = useMuseionStore((s) => s.moveSceneToSequence)
  const reorderScenes = useMuseionStore((s) => s.reorderScenes)
  const setSceneCanvasPosition = useMuseionStore((s) => s.setSceneCanvasPosition)
  const setCanvasViewport = useMuseionStore((s) => s.setCanvasViewport)
  const resetCanvasLayout = useMuseionStore((s) => s.resetCanvasLayout)
  const addEdge = useMuseionStore((s) => s.addEdge)
  const removeEdge = useMuseionStore((s) => s.removeEdge)
  const registerPreview = useMuseionStore((s) => s.registerPreview)
  const attachAssetToScene = useMuseionStore((s) => s.attachAssetToScene)
  const restoreAndApproveAsset = useMuseionStore((s) => s.restoreAndApproveAsset)
  const deleteAsset = useMuseionStore((s) => s.deleteAsset)

  const [pinnedSequenceId, setPinnedSequenceId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [momentFilter, setMomentFilter] = useState<SceneMoment | 'all'>('all')
  const [placeFilter, setPlaceFilter] = useState<'all' | 'INT' | 'EXT'>('all')
  const [archivesOpen, setArchivesOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [lastPreviewAssetId, setLastPreviewAssetId] = useState<string | null>(null)
  const [sceneToDelete, setSceneToDelete] = useState<StoryboardScene | null>(null)
  const [binOpen, setBinOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null)

  useEffect(() => {
    const apply = () => {
      const narrow = window.innerWidth < 1280
      setBinOpen(!narrow)
      setInspectorOpen(!narrow)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // La sélection globale peut viser un autre projet : on retombe alors
  // sur la première scène du projet courant, jamais sur celle d'un voisin.
  const effectiveSceneId = scenes.some((s) => s.id === selectedSceneId)
    ? selectedSceneId
    : (scenes[0]?.id ?? null)

  useEffect(() => {
    if (selectedSceneId !== effectiveSceneId) {
      selectScene(effectiveSceneId)
    }
  }, [selectedSceneId, effectiveSceneId, selectScene])

  const selectedScene = scenes.find((s) => s.id === effectiveSceneId)
  const activeSequenceId =
    pinnedSequenceId ?? selectedScene?.sequenceId ?? sequences[0]?.id ?? ''

  const handleSelectScene = (sceneId: string) => {
    setPinnedSequenceId(null)
    selectScene(sceneId)
  }

  const filteredScenes = useMemo(
    () =>
      scenes.filter((scene) => {
        if (momentFilter !== 'all' && scene.moment !== momentFilter) return false
        if (placeFilter !== 'all' && !scene.timeOfDay.includes(placeFilter)) return false
        return true
      }),
    [scenes, momentFilter, placeFilter]
  )

  const filtersActive = momentFilter !== 'all' || placeFilter !== 'all'
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleGeneratePreview = useCallback(async () => {
    if (!selectedScene || !project) return
    setGenerating(true)
    try {
      const preview = await activePreviewProvider.generate({
        subject: `${selectedScene.title} — ${selectedScene.description || selectedScene.intention}`,
        location: selectedScene.location,
        intention: selectedScene.intention,
        shotType: selectedScene.mainShotType ?? 'wide',
        lighting: selectedScene.lighting,
        interior: selectedScene.timeOfDay === 'INT',
        sceneId: selectedScene.id,
        projectId: project.id,
      })
      const asset = registerPreview(preview, {
        name: `Prévisualisation — ${selectedScene.title}`,
        sceneId: selectedScene.id,
        projectId: project.id,
        metadata: {
          'Type de plan': selectedScene.mainShotType ?? 'wide',
          Lumière: selectedScene.lighting,
          Lieu: selectedScene.location,
        },
      })
      attachAssetToScene(asset.id, selectedScene.id)
      setLastPreviewAssetId(asset.id)
    } finally {
      setGenerating(false)
    }
  }, [selectedScene, project, registerPreview, attachAssetToScene])

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'asset') setDraggedAssetId(String(data.assetId))
  }

  const handleAssetDragEnd = (event: DragEndEvent) => {
    setDraggedAssetId(null)
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type !== 'asset' || overData?.type !== 'scene') return
    attachAssetToScene(String(activeData.assetId), String(overData.sceneId))
    selectScene(String(overData.sceneId))
  }

  if (!project) return null

  const draggedAsset = draggedAssetId ? assets.find((a) => a.id === draggedAssetId) : undefined
  const isEmpty = sequences.length === 0

  return (
    <>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {view === 'classic' ? 'Storyboard' : 'Tableau dynamique'}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {view === 'classic'
                ? 'Organisez vos séquences et visualisez vos scènes clés.'
                : 'Reliez vos scènes, ouvrez des branches, réorganisez le récit.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveIndicator />

            <div
              className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1"
              role="tablist"
              aria-label="Vues du storyboard"
            >
              <ViewLink
                href={`/cinema/projects/${slug}/storyboard`}
                active={view === 'classic'}
                icon={LayoutGrid}
                label="Storyboard classique"
              />
              <ViewLink
                href={`/cinema/projects/${slug}/board`}
                active={view === 'board'}
                icon={Workflow}
                label="Tableau dynamique"
              />
            </div>

            {view === 'classic' && !isEmpty && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  title="Filtrer les scènes"
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border px-3 text-sm transition-colors',
                    filtersActive
                      ? 'border-[var(--interactive-border)] bg-[var(--interactive-dim)] text-[var(--text-primary)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  )}
                >
                  <SlidersHorizontal size={14} />
                  Filtres
                </button>

                {filtersOpen && (
                  <div className="absolute right-0 top-11 z-30 w-60 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 shadow-xl">
                    <p className="label-caps">Moment</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {MOMENT_FILTERS.map((moment) => (
                        <FilterChip
                          key={moment}
                          active={momentFilter === moment}
                          onClick={() => setMomentFilter(moment)}
                          label={moment === 'all' ? 'Tous' : moment}
                        />
                      ))}
                    </div>

                    <p className="label-caps mt-3">Intérieur / Extérieur</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(['all', 'INT', 'EXT'] as const).map((place) => (
                        <FilterChip
                          key={place}
                          active={placeFilter === place}
                          onClick={() => setPlaceFilter(place)}
                          label={place === 'all' ? 'Tous' : place}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setArchivesOpen(true)}
              title="Archives temporaires"
              aria-label="Ouvrir les archives temporaires"
              className="flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <Archive size={14} />
              Archives
            </button>

            {view === 'board' && (
              <PanelToggle
                open={binOpen}
                onClick={() => setBinOpen((open) => !open)}
                openIcon={PanelLeftClose}
                closedIcon={PanelLeftOpen}
                label={binOpen ? 'Replier le bac d’assets' : 'Afficher le bac d’assets'}
              />
            )}
            <PanelToggle
              open={inspectorOpen}
              onClick={() => setInspectorOpen((open) => !open)}
              openIcon={PanelRightClose}
              closedIcon={PanelRightOpen}
              label={inspectorOpen ? 'Replier l’inspecteur' : 'Afficher l’inspecteur'}
            />
          </div>
        </div>
      </header>

      {isEmpty ? (
        <EmptyStoryboard project={project.title} onCreate={() => addSequence(project.id)} />
      ) : (
        <DndContext
          id="museion-storyboard-assets"
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleAssetDragEnd}
          onDragCancel={() => setDraggedAssetId(null)}
        >
          <div className="flex min-h-0 flex-1">
            {view === 'board' && binOpen && (
              <div className="w-[228px] shrink-0">
                <AssetBin assets={assets} onOpenArchives={() => setArchivesOpen(true)} />
              </div>
            )}

            {view === 'classic' ? (
              <div data-tour="sequence-strip" className="flex min-w-0 flex-1">
                <ClassicView
                  sequences={sequences}
                  scenes={filteredScenes}
                  assets={assets}
                  activeSequenceId={activeSequenceId}
                  selectedSceneId={effectiveSceneId}
                  onActiveSequenceChange={setPinnedSequenceId}
                  onSelectScene={handleSelectScene}
                  onAddScene={() => activeSequenceId && addScene(activeSequenceId)}
                  onDuplicateScene={(sceneId) => duplicateScene(sceneId)}
                  onDeleteScene={(sceneId) =>
                    setSceneToDelete(scenes.find((s) => s.id === sceneId) ?? null)
                  }
                  onMoveSceneToSequence={moveSceneToSequence}
                  onReorder={reorderScenes}
                />
              </div>
            ) : (
              <div data-tour="canvas" className="flex min-w-0 flex-1">
                <DynamicCanvas
                  scenes={scenes}
                  sequences={sequences}
                  assets={assets}
                  storyboardEdges={edges}
                  selectedSceneId={effectiveSceneId}
                  viewport={canvasViewport}
                  onSelectScene={selectScene}
                  onMoveScene={setSceneCanvasPosition}
                  onConnectScenes={(source, target, type) => addEdge(source, target, type)}
                  onRemoveEdge={removeEdge}
                  onResetLayout={resetCanvasLayout}
                  onViewportChange={setCanvasViewport}
                />
              </div>
            )}

            {inspectorOpen && (
              <div className="w-[320px] shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <SceneInspector
                  scene={selectedScene}
                  assets={assets}
                  projectSlug={slug}
                  generating={generating}
                  lastPreviewAssetId={lastPreviewAssetId}
                  onUpdate={(patch) => selectedScene && updateScene(selectedScene.id, patch)}
                  onGeneratePreview={handleGeneratePreview}
                  onDelete={() => selectedScene && setSceneToDelete(selectedScene)}
                />
              </div>
            )}
          </div>

          <DragOverlay>
            {draggedAsset ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--interactive-border)] bg-[var(--bg-card)] p-1.5 shadow-2xl">
                <PreviewFrame
                  url={draggedAsset.url}
                  alt={draggedAsset.name}
                  className="h-8 w-[52px] overflow-hidden rounded-[3px]"
                />
                <span className="pr-1 text-[11px] text-[var(--text-primary)]">
                  {draggedAsset.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TemporaryArchives
        open={archivesOpen}
        assets={assets}
        scenes={scenes}
        projectTitle={project.title}
        onClose={() => setArchivesOpen(false)}
        onRestore={(assetId) => restoreAndApproveAsset(assetId)}
        onDelete={(assetId) => deleteAsset(assetId)}
      />

      <ConfirmDialog
        open={sceneToDelete !== null}
        title="Supprimer la scène"
        message={`La scène ${sceneToDelete ? String(sceneToDelete.number).padStart(2, '0') : ''} « ${sceneToDelete?.title ?? ''} » et ses plans techniques seront supprimés. Les assets rattachés retournent au bac.`}
        confirmLabel="Supprimer la scène"
        onCancel={() => setSceneToDelete(null)}
        onConfirm={() => {
          if (sceneToDelete) removeScene(sceneToDelete.id)
          setSceneToDelete(null)
        }}
      />
    </>
  )
}

function EmptyStoryboard({ project, onCreate }: { project: string; onCreate: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <p className="label-caps">Storyboard vide</p>
        <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
          {project} n’a pas encore de séquence
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Un storyboard se construit par séquences, puis par scènes. Créez la première séquence
          pour commencer le découpage. Aucune donnée d’un autre projet n’est reprise ici.
        </p>
        <Button variant="primary" className="mt-5" onClick={onCreate}>
          <Plus size={14} />
          Créer la première séquence
        </Button>
      </div>
    </div>
  )
}

function ViewLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active: boolean
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors duration-[var(--transition-fast)]',
        active
          ? 'bg-[var(--interactive-dim)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
        active
          ? 'border-[var(--interactive-border)] bg-[var(--interactive-dim)] text-[var(--text-primary)]'
          : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      )}
    >
      {label}
    </button>
  )
}

function PanelToggle({
  open,
  onClick,
  openIcon: OpenIcon,
  closedIcon: ClosedIcon,
  label,
}: {
  open: boolean
  onClick: () => void
  openIcon: React.ElementType
  closedIcon: React.ElementType
  label: string
}) {
  const Icon = open ? OpenIcon : ClosedIcon
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={open}
      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
    >
      <Icon size={14} />
    </button>
  )
}
