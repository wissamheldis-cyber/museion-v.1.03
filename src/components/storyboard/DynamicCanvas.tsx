'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Crosshair, GitBranch, LayoutGrid, Unlink, Workflow } from 'lucide-react'
import type { Asset, Sequence, StoryboardEdge, StoryboardScene } from '@/lib/types-storyboard'
import { cn } from '@/lib/utils'
import { SceneNode, type SceneNodeType } from './SceneNode'
import { sceneThumbUrl } from './sceneVisual'

const nodeTypes = { scene: SceneNode }

interface DynamicCanvasProps {
  scenes: StoryboardScene[]
  sequences: Sequence[]
  assets: Asset[]
  storyboardEdges: StoryboardEdge[]
  selectedSceneId: string | null
  viewport: { x: number; y: number; zoom: number }
  onSelectScene: (sceneId: string) => void
  onMoveScene: (sceneId: string, position: { x: number; y: number }) => void
  onConnectScenes: (source: string, target: string, type: StoryboardEdge['type']) => void
  onRemoveEdge: (edgeId: string) => void
  onResetLayout: () => void
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
}

export function DynamicCanvas(props: DynamicCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function CanvasInner({
  scenes,
  sequences,
  assets,
  storyboardEdges,
  selectedSceneId,
  viewport,
  onSelectScene,
  onMoveScene,
  onConnectScenes,
  onRemoveEdge,
  onResetLayout,
  onViewportChange,
}: DynamicCanvasProps) {
  const { fitView } = useReactFlow()
  const [connectionType, setConnectionType] = useState<StoryboardEdge['type']>('sequential')
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const computedNodes: SceneNodeType[] = useMemo(
    () =>
      scenes.map((scene) => {
        const sequence = sequences.find((s) => s.id === scene.sequenceId)
        return {
          id: scene.id,
          type: 'scene' as const,
          position: scene.canvasPosition,
          data: {
            sceneId: scene.id,
            number: scene.number,
            title: scene.title,
            intention: scene.intention,
            duration: scene.duration,
            thumbUrl: sceneThumbUrl(scene, assets),
            color: sequence?.color ?? '#ececea',
            isSelected: scene.id === selectedSceneId,
          },
        }
      }),
    [scenes, sequences, assets, selectedSceneId]
  )

  const computedEdges: Edge[] = useMemo(
    () =>
      storyboardEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.type === 'alternative',
        style: {
          stroke: edge.type === 'alternative' ? '#c9a84c' : 'rgba(255,255,255,0.32)',
          strokeWidth: edge.id === selectedEdgeId ? 2 : 1.25,
          strokeDasharray: edge.type === 'alternative' ? '5 4' : undefined,
        },
        labelStyle: { fill: '#8e9099', fontSize: 10 },
        labelBgStyle: { fill: '#0d0e11' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.type === 'alternative' ? '#c9a84c' : 'rgba(255,255,255,0.45)',
        },
      })),
    [storyboardEdges, selectedEdgeId]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<SceneNodeType>(computedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(computedEdges)

  useEffect(() => {
    setNodes(computedNodes)
  }, [computedNodes, setNodes])

  useEffect(() => {
    setEdges(computedEdges)
  }, [computedEdges, setEdges])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      onConnectScenes(connection.source, connection.target, connectionType)
    },
    [connectionType, onConnectScenes]
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onSelectScene(node.id)
      setSelectedEdgeId(null)
    },
    [onSelectScene]
  )

  const handleNodeDragStop: OnNodeDrag<SceneNodeType> = useCallback(
    (_event, node) => {
      onMoveScene(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) })
    },
    [onMoveScene]
  )

  const handleMoveEnd = useCallback(
    (_event: unknown, nextViewport: Viewport) => {
      onViewportChange({
        x: Math.round(nextViewport.x),
        y: Math.round(nextViewport.y),
        zoom: Number(nextViewport.zoom.toFixed(3)),
      })
    },
    [onViewportChange]
  )

  const selectedEdge = storyboardEdges.find((edge) => edge.id === selectedEdgeId)

  return (
    <div className="relative h-full min-w-0 flex-1 bg-[var(--bg-base)]">
      {/* Barre d'outils du canvas */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <div
          className="panel flex items-center gap-1 rounded-[var(--radius-md)] p-1"
          role="group"
          aria-label="Type de connexion à créer"
        >
          <ToolbarToggle
            active={connectionType === 'sequential'}
            onClick={() => setConnectionType('sequential')}
            icon={Workflow}
            label="Séquentiel"
          />
          <ToolbarToggle
            active={connectionType === 'alternative'}
            onClick={() => setConnectionType('alternative')}
            icon={GitBranch}
            label="Branche alternative"
          />
        </div>

        <div className="panel flex items-center gap-1 rounded-[var(--radius-md)] p-1">
          <ToolbarButton
            onClick={() => fitView({ padding: 0.2, duration: 200 })}
            icon={Crosshair}
            label="Recentrer"
          />
          <ToolbarButton
            onClick={() => {
              onResetLayout()
              window.setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 60)
            }}
            icon={LayoutGrid}
            label="Réinitialiser la disposition"
          />
        </div>
      </div>

      {/* Panneau de connexion sélectionnée */}
      {selectedEdge && (
        <div className="panel absolute bottom-3 left-3 z-10 max-w-xs rounded-[var(--radius-md)] p-3">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            Connexion {selectedEdge.type === 'alternative' ? 'alternative' : 'séquentielle'}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {sceneLabel(scenes, selectedEdge.source)} → {sceneLabel(scenes, selectedEdge.target)}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Supprimer la connexion ne supprime jamais les scènes reliées.
          </p>
          <button
            type="button"
            onClick={() => {
              onRemoveEdge(selectedEdge.id)
              setSelectedEdgeId(null)
            }}
            className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--state-danger)] transition-colors hover:bg-[var(--state-danger-dim)]"
          >
            <Unlink size={12} />
            Supprimer la connexion
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={(_event, edge) => setSelectedEdgeId(edge.id)}
        onPaneClick={() => setSelectedEdgeId(null)}
        onMoveEnd={handleMoveEnd}
        defaultViewport={viewport}
        minZoom={0.2}
        maxZoom={1.6}
        deleteKeyCode={null}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        className="museion-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1a1c21" />
        <Controls
          showInteractive={false}
          className="!border-[var(--border-default)] !bg-[var(--bg-surface)]"
        />
      </ReactFlow>

      <p className="pointer-events-none absolute bottom-3 right-3 z-10 text-[10px] text-[var(--text-muted)]">
        Maj + glisser : sélection multiple · Glisser depuis un point : connexion · Suppr. désactivé
      </p>
    </div>
  )
}

function sceneLabel(scenes: StoryboardScene[], sceneId: string): string {
  const scene = scenes.find((s) => s.id === sceneId)
  return scene ? `${String(scene.number).padStart(2, '0')} ${scene.title}` : sceneId
}

function ToolbarToggle({
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
        'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs transition-colors',
        active
          ? 'bg-[var(--interactive-dim)] text-[var(--interactive)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
