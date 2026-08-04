'use client'

import { useState } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Plus, ChevronDown, ChevronUp, User } from 'lucide-react'
import type { Project, Character } from '@/lib/types'

interface CharactersTabProps {
  project: Project
}

export function CharactersTab({ project }: CharactersTabProps) {
  const { updateCharacter, addCharacter } = useMuseionStore()
  const [expanded, setExpanded] = useState<string | null>(project.characters[0]?.id ?? null)
  const [addingNew, setAddingNew] = useState(false)
  const [newChar, setNewChar] = useState({ name: '', role: '' })

  const handleAddCharacter = () => {
    if (!newChar.name.trim()) return
    addCharacter(project.id, {
      name: newChar.name,
      role: newChar.role,
      objective: '',
      innerNeed: '',
      contradiction: '',
      arc: '',
      relations: [],
      appearance: '',
      costume: '',
      continuityNotes: '',
      references: [],
    })
    setNewChar({ name: '', role: '' })
    setAddingNew(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Personnages</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {project.characters.length} personnage{project.characters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddingNew(true)}>
          <Plus size={13} />
          Ajouter
        </Button>
      </div>

      {/* Formulaire ajout */}
      {addingNew && (
        <div className="mb-4 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--accent-blue)]/30">
          <div className="flex gap-3 mb-3">
            <Input
              id="new-char-name"
              label="Nom"
              placeholder="Ex : Gilgamesh"
              value={newChar.name}
              onChange={(e) => setNewChar((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              id="new-char-role"
              label="Rôle"
              placeholder="Ex : Protagoniste"
              value={newChar.role}
              onChange={(e) => setNewChar((p) => ({ ...p, role: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleAddCharacter} disabled={!newChar.name.trim()}>
              Créer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingNew(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Liste des personnages */}
      <div className="space-y-3">
        {project.characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            isExpanded={expanded === char.id}
            onToggle={() => setExpanded(expanded === char.id ? null : char.id)}
            onUpdate={(patch) => updateCharacter(project.id, { ...char, ...patch })}
          />
        ))}
      </div>

      {project.characters.length === 0 && !addingNew && (
        <div className="text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <User size={28} className="mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-muted)]">Aucun personnage. Ajoutez-en un.</p>
        </div>
      )}
    </div>
  )
}

function CharacterCard({
  character,
  isExpanded,
  onToggle,
  onUpdate,
}: {
  character: Character
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<Character>) => void
}) {
  const FIELDS: { key: keyof Character; label: string; placeholder: string; rows?: number }[] = [
    { key: 'objective', label: 'Objectif', placeholder: 'Ce que le personnage veut.', rows: 2 },
    { key: 'innerNeed', label: 'Besoin intérieur', placeholder: 'Ce dont il a vraiment besoin.', rows: 2 },
    { key: 'contradiction', label: 'Contradiction', placeholder: 'Ce qui le rend complexe.', rows: 2 },
    { key: 'arc', label: 'Arc', placeholder: 'Comment évolue-t-il ?', rows: 2 },
    { key: 'appearance', label: 'Apparence', placeholder: 'Description physique.', rows: 2 },
    { key: 'costume', label: 'Costume', placeholder: 'Vêtements et accessoires.', rows: 1 },
    { key: 'continuityNotes', label: 'Continuité', placeholder: 'Notes de continuité.', rows: 1 },
  ]

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
        onClick={onToggle}
      >
        <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
          {character.name[0]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{character.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{character.role || 'Sans rôle'}</p>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id={`char-${character.id}-name`}
              label="Nom"
              value={character.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
            <Input
              id={`char-${character.id}-role`}
              label="Rôle"
              value={character.role}
              onChange={(e) => onUpdate({ role: e.target.value })}
            />
          </div>

          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <Textarea
              key={key}
              id={`char-${character.id}-${key}`}
              label={label}
              placeholder={placeholder}
              value={String(character[key] ?? '')}
              onChange={(e) => onUpdate({ [key]: e.target.value })}
              rows={rows ?? 2}
            />
          ))}

          {/* Relations */}
          {character.relations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Relations
              </p>
              <div className="space-y-2">
                {character.relations.map((rel, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="font-medium text-[var(--text-primary)]">{rel.characterName}</span>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="text-[var(--text-muted)]">{rel.relationshipType}</span>
                    <span className="text-[var(--text-muted)]">—</span>
                    <span className="text-[var(--text-secondary)] flex-1">{rel.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
