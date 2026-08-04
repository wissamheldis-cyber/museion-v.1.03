'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Archive, Check, Trash2, X } from 'lucide-react'
import type { Asset, StoryboardScene } from '@/lib/types-storyboard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PreviewFrame } from '@/components/ui/PreviewFrame'
import { EPHEMERAL_TTL_DAYS, daysRemaining, isUsedInStoryboard } from '@/lib/assetLifecycle'
import { formatDate } from '@/lib/utils'

interface TemporaryArchivesProps {
  open: boolean
  assets: Asset[]
  scenes: StoryboardScene[]
  projectTitle: string
  onClose: () => void
  onRestore: (assetId: string) => void
  onDelete: (assetId: string) => void
}

export function TemporaryArchives({
  open,
  assets,
  scenes,
  projectTitle,
  onClose,
  onRestore,
  onDelete,
}: TemporaryArchivesProps) {
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null)

  const temporary = useMemo(
    () =>
      assets
        .filter((asset) => asset.status === 'ephemeral')
        .sort((a, b) => daysRemaining(a) - daysRemaining(b)),
    [assets]
  )

  if (!open) return null

  const requestDelete = (asset: Asset) => {
    if (isUsedInStoryboard(asset)) {
      setPendingDelete(asset)
      return
    }
    onDelete(asset.id)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Archives temporaires"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]">
        <header className="flex items-start justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Archive size={16} className="text-[var(--accent-champagne)]" />
              Archives temporaires
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Les prévisualisations locales expirent {EPHEMERAL_TTL_DAYS} jours après leur création.
              Aucune suppression automatique n’est effectuée sans confirmation humaine.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les archives temporaires"
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {temporary.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--text-muted)]">
              Aucun asset temporaire. Générez une prévisualisation pour en créer un.
            </p>
          ) : (
            <ul className="space-y-3">
              {temporary.map((asset) => {
                const remaining = daysRemaining(asset)
                const scene = asset.sceneId ? scenes.find((s) => s.id === asset.sceneId) : undefined
                const expired = remaining <= 0

                return (
                  <li
                    key={asset.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3"
                  >
                    <div className="flex gap-3">
                      <PreviewFrame
                        url={asset.url}
                        alt={asset.name}
                        className="h-[72px] w-32 shrink-0 overflow-hidden rounded-[var(--radius-sm)]"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {asset.name}
                          </p>
                          <Badge variant={expired ? 'red' : remaining <= 3 ? 'amber' : 'ghost'}>
                            {expired
                              ? 'Échéance dépassée'
                              : `${remaining} jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
                          </Badge>
                        </div>

                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                          <Row label="Créé le" value={formatDate(asset.createdAt)} />
                          <Row label="Projet" value={projectTitle} />
                          <Row
                            label="Scène"
                            value={
                              scene
                                ? `${String(scene.number).padStart(2, '0')} — ${scene.title}`
                                : 'Non rattaché'
                            }
                          />
                          <Row label="Modèle simulé" value={asset.simulatedModel ?? '—'} />
                        </dl>

                        <p className="mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-[var(--text-muted)]">
                          « {asset.prompt ?? 'Aucun prompt enregistré'} »
                        </p>

                        {isUsedInStoryboard(asset) && (
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--accent-champagne)]">
                            <AlertTriangle size={12} />
                            Utilisé dans le storyboard — suppression soumise à confirmation.
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button variant="primary" size="sm" onClick={() => onRestore(asset.id)}>
                            <Check size={12} />
                            Restaurer et valider
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => requestDelete(asset)}>
                            <Trash2 size={12} />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer un asset utilisé dans le storyboard"
        message={`« ${pendingDelete?.name ?? ''} » est rattaché à une scène. La suppression est définitive : un asset supprimé ne peut plus jamais être validé.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate text-[var(--text-secondary)]">{value}</dd>
    </div>
  )
}
