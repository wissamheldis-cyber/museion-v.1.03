'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Asset, Sequence, StoryboardScene } from '@/lib/types-storyboard'
import { SceneCard } from './SceneCard'
import { SequenceStrip } from './SequenceStrip'
import { formatTimecode } from './sceneVisual'

interface ClassicViewProps {
  sequences: Sequence[]
  scenes: StoryboardScene[]
  assets: Asset[]
  activeSequenceId: string
  selectedSceneId: string | null
  onActiveSequenceChange: (sequenceId: string) => void
  onSelectScene: (sceneId: string) => void
  onAddScene: () => void
  onDuplicateScene: (sceneId: string) => void
  onDeleteScene: (sceneId: string) => void
  onMoveSceneToSequence: (sceneId: string, sequenceId: string) => void
  onReorder: (sequenceId: string, orderedIds: string[]) => void
}

export function ClassicView({
  sequences,
  scenes,
  assets,
  activeSequenceId,
  selectedSceneId,
  onActiveSequenceChange,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveSceneToSequence,
  onReorder,
}: ClassicViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeSequence = sequences.find((s) => s.id === activeSequenceId) ?? sequences[0]

  const sequenceScenes = useMemo(
    () =>
      scenes
        .filter((scene) => scene.sequenceId === activeSequence?.id)
        .sort((a, b) => a.order - b.order),
    [scenes, activeSequence?.id]
  )

  const totalDuration = sequenceScenes.reduce((sum, scene) => sum + scene.duration, 0)

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !activeSequence) return

    const ids = sequenceScenes.map((scene) => scene.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return

    onReorder(activeSequence.id, arrayMove(ids, from, to))
  }

  const draggedScene = draggingId ? sequenceScenes.find((s) => s.id === draggingId) : undefined

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b border-[var(--border-subtle)] px-6 py-3">
        <SequenceStrip
          sequences={sequences}
          scenes={scenes}
          assets={assets}
          activeSequenceId={activeSequence?.id ?? ''}
          onSelect={onActiveSequenceChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">
            Séq. {String(activeSequence?.number ?? 0).padStart(2, '0')}{' '}
            <span className="text-[var(--text-secondary)]">— {activeSequence?.title}</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {sequenceScenes.length} scène{sequenceScenes.length > 1 ? 's' : ''} ·{' '}
            {formatTimecode(totalDuration)}
          </p>
        </div>

        <DndContext
          id="museion-storyboard-classique"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingId(null)}
        >
          <SortableContext items={sequenceScenes.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sequenceScenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  assets={assets}
                  sequences={sequences}
                  selected={scene.id === selectedSceneId}
                  onSelect={() => onSelectScene(scene.id)}
                  onDuplicate={() => onDuplicateScene(scene.id)}
                  onDelete={() => onDeleteScene(scene.id)}
                  onMoveToSequence={(sequenceId) => onMoveSceneToSequence(scene.id, sequenceId)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {draggedScene ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--interactive)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-2xl">
                {String(draggedScene.number).padStart(2, '0')} — {draggedScene.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          type="button"
          onClick={onAddScene}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] py-5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--interactive)] hover:text-[var(--text-primary)]"
        >
          <Plus size={15} />
          Ajouter une scène
        </button>
      </div>
    </div>
  )
}
