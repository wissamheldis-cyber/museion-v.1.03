'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Button } from '@/components/ui/Button'
import { Save, RotateCcw, Clock } from 'lucide-react'
import { countWords, formatRelativeDate } from '@/lib/utils'
import type { Project } from '@/lib/types'

interface LoglineTabProps {
  project: Project
}

export function LoglineTab({ project }: LoglineTabProps) {
  const { saveLoglineVersion, restoreLoglineVersion } = useMuseionStore()
  const [draft, setDraft] = useState(project.logline)
  const [showHistory, setShowHistory] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)

  const wordCount = countWords(draft)
  const hasChanges = draft !== project.logline

  const handleSave = () => {
    if (!draft.trim() || !hasChanges) return
    saveLoglineVersion(project.id, draft)
  }

  const handleRestore = (versionId: string) => {
    if (restoreConfirm === versionId) {
      restoreLoglineVersion(project.id, versionId)
      const version = project.loglineHistory.find((v) => v.id === versionId)
      if (version) setDraft(version.content)
      setRestoreConfirm(null)
    } else {
      setRestoreConfirm(versionId)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Logline</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Une seule phrase. Qui veut quoi, contre quoi, pourquoi ça compte.
        </p>
      </div>

      {/* Éditeur */}
      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex : Quand [personnage] veut [objectif], il doit [obstacle] avant que [enjeu]."
          rows={4}
          className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--interactive)] focus:ring-1 focus:ring-[var(--interactive)]/30 resize-none transition-all leading-relaxed"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span className={`text-xs metric ${wordCount > 40 ? 'text-[var(--state-warn)]' : 'text-[var(--text-muted)]'}`}>
            {wordCount} mot{wordCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Indication longueur */}
      <div className="flex items-center gap-1 mt-1.5">
        {[10, 20, 30, 40].map((n) => (
          <div
            key={n}
            className={`h-0.5 flex-1 rounded-full transition-all ${
              wordCount >= n ? 'bg-[var(--interactive)]' : 'bg-[var(--bg-elevated)]'
            }`}
          />
        ))}
        <span className="text-[10px] text-[var(--text-muted)] ml-1">Idéal : 20–35 mots</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={!hasChanges || !draft.trim()}
        >
          <Save size={14} />
          Sauvegarder
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => setShowHistory(!showHistory)}
        >
          <Clock size={14} />
          Historique ({project.loglineHistory.length})
        </Button>
        {hasChanges && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraft(project.logline)}
          >
            Annuler
          </Button>
        )}
      </div>

      {/* Historique des versions */}
      {showHistory && (
        <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
          <h3 className="label-caps mb-3">
            Historique des versions
          </h3>
          {project.loglineHistory.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Aucune version sauvegardée.</p>
          ) : (
            <div className="space-y-2">
              {project.loglineHistory.map((version, i) => (
                <div
                  key={version.id}
                  className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {version.label && (
                          <span className="text-[10px] font-medium text-[var(--interactive)] bg-[var(--interactive-dim)] px-1.5 py-0.5 rounded">
                            {version.label}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {formatRelativeDate(version.savedAt)} · {version.wordCount} mots
                        </span>
                        {i === 0 && (
                          <span className="text-[10px] text-[var(--state-ok)] font-medium">Actuelle</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {version.content}
                      </p>
                    </div>
                    {i !== 0 && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        className={`shrink-0 flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all ${
                          restoreConfirm === version.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <RotateCcw size={11} />
                        {restoreConfirm === version.id ? 'Confirmer ?' : 'Restaurer'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
