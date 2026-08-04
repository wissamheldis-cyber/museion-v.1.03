'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Image as ImageIcon, Info, Video, X } from 'lucide-react'
import type { Shot, StoryboardScene } from '@/lib/types-storyboard'
import { Button } from '@/components/ui/Button'
import { composePromptFromShot, PROMPT_NOTICE } from '@/lib/promptComposer'
import { buildComfyUIContract, COMFYUI_INACTIVE_MESSAGE } from '@/providers/preview'
import { KNOWLEDGE_DISCLAIMER } from '@/knowledge/camera'
import { cn } from '@/lib/utils'

interface PromptComposerProps {
  open: boolean
  shot: Shot | undefined
  scene: StoryboardScene | undefined
  onClose: () => void
}

export function PromptComposer({ open, shot, scene, onClose }: PromptComposerProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [showContract, setShowContract] = useState(false)

  const composed = useMemo(
    () => (shot ? composePromptFromShot(shot, scene) : null),
    [shot, scene]
  )

  const contract = useMemo(() => {
    if (!shot || !composed) return null
    return buildComfyUIContract(
      {
        subject: scene?.title ?? shot.notes,
        location: shot.decor,
        intention: scene?.intention ?? '',
        shotType: shot.type,
        lighting: shot.lighting,
        sceneId: shot.sceneId,
        shotId: shot.id,
        projectId: shot.projectId,
      },
      composed.imagePrompt
    )
  }, [shot, scene, composed])

  if (!open || !shot || !composed) return null

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Prévisualisation du prompt"
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
        <header className="flex items-start justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Prévisualisation du prompt
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Plan {String(shot.number).padStart(2, '0')} — {PROMPT_NOTICE} Aucun LLM n’intervient.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la prévisualisation du prompt"
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PromptBlock
            icon={ImageIcon}
            title="Prompt image"
            value={composed.imagePrompt}
            copied={copied === 'image'}
            onCopy={() => copy('image', composed.imagePrompt)}
          />

          <PromptBlock
            icon={Video}
            title="Prompt vidéo"
            value={composed.videoPrompt}
            copied={copied === 'video'}
            onCopy={() => copy('video', composed.videoPrompt)}
            className="mt-4"
          />

          <section className="mt-5">
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              Paramètres validés utilisés
            </h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {Object.entries(composed.parameters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--border-subtle)] py-1 text-xs"
                >
                  <dt className="shrink-0 text-[var(--text-muted)]">{key}</dt>
                  <dd className="truncate text-right text-[var(--text-secondary)]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-5">
            <button
              type="button"
              onClick={() => setShowContract((value) => !value)}
              aria-expanded={showContract}
              className="text-xs text-[var(--accent-blue)] transition-colors hover:text-[var(--accent-blue-hover)]"
            >
              {showContract ? 'Masquer' : 'Afficher'} le contrat JSON ComfyUI (inactif)
            </button>

            {showContract && contract && (
              <div className="mt-2">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--accent-champagne)]">
                  <Info size={12} />
                  {COMFYUI_INACTIVE_MESSAGE}
                </p>
                <pre className="max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {JSON.stringify(contract, null, 2)}
                </pre>
              </div>
            )}
          </section>

          <p className="mt-5 text-[11px] leading-relaxed text-[var(--text-muted)]">
            {KNOWLEDGE_DISCLAIMER}
          </p>
        </div>

        <footer className="border-t border-[var(--border-subtle)] px-5 py-3 text-right">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </footer>
      </div>
    </div>
  )
}

function PromptBlock({
  icon: Icon,
  title,
  value,
  copied,
  onCopy,
  className,
}: {
  icon: React.ElementType
  title: string
  value: string
  copied: boolean
  onCopy: () => void
  className?: string
}) {
  return (
    <section className={cn(className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
          <Icon size={13} className="text-[var(--text-muted)]" />
          {title}
        </h3>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <p className="mt-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {value}
      </p>
    </section>
  )
}
