'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { useDroppable } from '@dnd-kit/core'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { cn } from '@/lib/utils'
import { formatTimecode } from './sceneVisual'

export interface SceneNodeData extends Record<string, unknown> {
  sceneId: string
  number: number
  title: string
  intention: string
  duration: number
  thumbUrl: string
  color: string
  isSelected: boolean
}

export type SceneNodeType = Node<SceneNodeData, 'scene'>

export function SceneNode({ data }: NodeProps<SceneNodeType>) {
  const { isOver, setNodeRef } = useDroppable({
    id: data.sceneId,
    data: { type: 'scene', sceneId: data.sceneId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-[196px] overflow-hidden rounded-[var(--radius-md)] border bg-[var(--bg-card)] transition-colors duration-[var(--transition-fast)]',
        data.isSelected
          ? 'border-[var(--interactive)] ring-1 ring-[var(--interactive)]/40'
          : 'border-[var(--border-default)]',
        isOver && 'border-[var(--accent-champagne)] ring-2 ring-[var(--accent-champagne)]/40'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-[var(--bg-base)] !bg-[var(--text-secondary)]"
      />

      <PreviewFrame
        url={data.thumbUrl}
        alt={`Scène ${data.number} — ${data.title}`}
        className="aspect-video"
      >
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-[var(--text-primary)]">
          {String(data.number).padStart(2, '0')}
        </span>
        <span
          className="absolute bottom-0 left-0 h-0.5 w-full"
          style={{ backgroundColor: data.color }}
        />
      </PreviewFrame>

      <div className="px-2 py-1.5">
        <div className="flex items-baseline justify-between gap-1">
          <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">{data.title}</p>
          <span className="shrink-0 text-[10px] metric text-[var(--text-muted)]">
            {formatTimecode(data.duration)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--text-secondary)]">
          {data.intention}
        </p>
        {isOver && (
          <p className="mt-1 text-[10px] text-[var(--accent-champagne)]">Déposer l’asset ici</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-[var(--bg-base)] !bg-[var(--text-secondary)]"
      />
    </div>
  )
}
