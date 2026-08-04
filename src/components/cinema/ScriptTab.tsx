'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Button } from '@/components/ui/Button'
import { cn, generateId } from '@/lib/utils'
import { Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { Project, ScriptScene, ScriptBlock, ScriptBlockType } from '@/lib/types'

interface ScriptTabProps {
  project: Project
}

const BLOCK_TYPES: { value: ScriptBlockType; label: string; shortcut: string }[] = [
  { value: 'scene-heading', label: 'En-tête de scène', shortcut: 'H' },
  { value: 'action', label: 'Action', shortcut: 'A' },
  { value: 'character', label: 'Personnage', shortcut: 'C' },
  { value: 'dialogue', label: 'Dialogue', shortcut: 'D' },
  { value: 'parenthetical', label: 'Parenthétique', shortcut: 'P' },
  { value: 'transition', label: 'Transition', shortcut: 'T' },
  { value: 'note', label: 'Note', shortcut: 'N' },
]

export function ScriptTab({ project }: ScriptTabProps) {
  const { updateScript } = useMuseionStore()
  const [scenes, setScenes] = useState<ScriptScene[]>(project.script?.scenes ?? [])
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set(scenes.map(s => s.id)))
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)

  const saveScenes = (updated: ScriptScene[]) => {
    setScenes(updated)
    updateScript(project.id, updated)
  }

  const addScene = () => {
    const newScene: ScriptScene = {
      id: generateId(),
      number: scenes.length + 1,
      title: `Scène ${scenes.length + 1}`,
      location: '',
      timeOfDay: 'EXT',
      blocks: [
        {
          id: generateId(),
          type: 'scene-heading',
          content: `EXT. LIEU — JOUR`,
          order: 1,
        },
      ],
      order: scenes.length + 1,
    }
    const updated = [...scenes, newScene]
    saveScenes(updated)
    setExpandedScenes((prev) => new Set([...prev, newScene.id]))
  }

  const deleteScene = (sceneId: string) => {
    if (deleteConfirm === sceneId) {
      saveScenes(scenes.filter((s) => s.id !== sceneId))
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(sceneId)
    }
  }

  const duplicateScene = (scene: ScriptScene) => {
    const newScene: ScriptScene = {
      ...scene,
      id: generateId(),
      number: scenes.length + 1,
      title: `${scene.title} (copie)`,
      blocks: scene.blocks.map((b) => ({ ...b, id: generateId() })),
      order: scenes.length + 1,
    }
    saveScenes([...scenes, newScene])
  }

  const addBlock = (sceneId: string, type: ScriptBlockType) => {
    const updated = scenes.map((s) => {
      if (s.id !== sceneId) return s
      const newBlock: ScriptBlock = {
        id: generateId(),
        type,
        content: '',
        order: s.blocks.length + 1,
      }
      return { ...s, blocks: [...s.blocks, newBlock] }
    })
    saveScenes(updated)
  }

  const updateBlock = (sceneId: string, blockId: string, content: string) => {
    const updated = scenes.map((s) => {
      if (s.id !== sceneId) return s
      return {
        ...s,
        blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
      }
    })
    saveScenes(updated)
  }

  const removeBlock = (sceneId: string, blockId: string) => {
    const updated = scenes.map((s) => {
      if (s.id !== sceneId) return s
      return { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) }
    })
    saveScenes(updated)
  }

  const toggleScene = (id: string) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Scénario</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {scenes.length} scène{scenes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={addScene}>
          <Plus size={13} />
          Ajouter une scène
        </Button>
      </div>

      {scenes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <p className="text-sm text-[var(--text-muted)]">Aucune scène. Commencez à écrire.</p>
          <Button variant="primary" size="md" className="mt-4" onClick={addScene}>
            <Plus size={14} />
            Première scène
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden"
            >
              {/* Header scène */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
                onClick={() => toggleScene(scene.id)}
              >
                <GripVertical size={14} className="text-[var(--text-muted)] cursor-grab" />
                <span className="text-xs font-mono text-[var(--text-muted)] w-6">{scene.number}</span>
                <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
                  {scene.title}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{scene.blocks.length} bloc{scene.blocks.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => duplicateScene(scene)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors rounded"
                    title="Dupliquer"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => deleteScene(scene.id)}
                    className={cn(
                      'p-1.5 transition-colors rounded',
                      deleteConfirm === scene.id
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-[var(--text-muted)] hover:text-red-400'
                    )}
                    title={deleteConfirm === scene.id ? 'Confirmer la suppression ?' : 'Supprimer'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {expandedScenes.has(scene.id) ? (
                  <ChevronUp size={14} className="text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                )}
              </div>

              {/* Contenu scène */}
              {expandedScenes.has(scene.id) && (
                <div className="border-t border-[var(--border-subtle)] p-4 space-y-2">
                  {scene.blocks.map((block) => (
                    <ScriptBlockEditor
                      key={block.id}
                      block={block}
                      isEditing={editingBlock === block.id}
                      onFocus={() => setEditingBlock(block.id)}
                      onBlur={() => setEditingBlock(null)}
                      onChange={(content) => updateBlock(scene.id, block.id, content)}
                      onRemove={() => removeBlock(scene.id, block.id)}
                    />
                  ))}

                  {/* Ajouter un bloc */}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {BLOCK_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        onClick={() => addBlock(scene.id, bt.value)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] px-2 py-1 rounded-full transition-all"
                      >
                        + {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScriptBlockEditor({
  block,
  isEditing,
  onFocus,
  onBlur,
  onChange,
  onRemove,
}: {
  block: ScriptBlock
  isEditing: boolean
  onFocus: () => void
  onBlur: () => void
  onChange: (content: string) => void
  onRemove: () => void
}) {
  const typeStyles: Record<ScriptBlockType, string> = {
    'scene-heading': 'font-mono font-bold text-[var(--text-primary)] uppercase tracking-wide',
    'action': 'text-[var(--text-secondary)]',
    'character': 'font-semibold text-[var(--text-primary)] uppercase text-center',
    'dialogue': 'text-[var(--text-primary)] pl-8 pr-8',
    'parenthetical': 'text-[var(--text-muted)] italic pl-12 pr-12',
    'transition': 'text-[var(--text-secondary)] uppercase text-right font-medium',
    'note': 'text-amber-400/80 italic bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1',
  }

  return (
    <div className="group relative flex gap-2">
      <div className="flex-1">
        <textarea
          value={block.content}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={block.type === 'scene-heading' ? 'INT/EXT. LIEU — MOMENT' :
                       block.type === 'character' ? 'NOM DU PERSONNAGE' :
                       block.type === 'dialogue' ? 'Le dialogue…' :
                       block.type === 'action' ? 'Description de l\'action…' :
                       block.type === 'parenthetical' ? '(parenthétique)' :
                       block.type === 'transition' ? 'FONDU AU NOIR.' :
                       'Note de l\'auteur…'}
          rows={Math.max(1, block.content.split('\n').length)}
          className={cn(
            'w-full bg-transparent text-sm resize-none focus:outline-none py-0.5 transition-colors',
            typeStyles[block.type],
            'placeholder:text-[var(--text-muted)]/40'
          )}
        />
        {isEditing && (
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">
            {BLOCK_TYPES.find(b => b.value === block.type)?.label}
          </span>
        )}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded mt-0.5"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
