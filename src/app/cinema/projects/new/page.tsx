'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { CinemaSidebar } from '@/components/layout/CinemaSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Check, ChevronRight } from 'lucide-react'
import { cn, slugify, countWords } from '@/lib/utils'
import type { ProjectFormat, ProjectGenre } from '@/lib/types'

type Step = 1 | 2 | 3 | 4

interface NewProjectForm {
  title: string
  type: ProjectFormat
  logline: string
  visualAmbition: string
  audience: string
  duration: string
  universe: string
  genre: ProjectGenre
}

const STEPS = [
  { id: 1, label: 'Intention' },
  { id: 2, label: 'Format' },
  { id: 3, label: 'Références' },
  { id: 4, label: 'Validation' },
]

const FORMAT_OPTIONS: { value: ProjectFormat; label: string; desc: string }[] = [
  { value: 'feature', label: 'Long métrage', desc: '70 min ou plus' },
  { value: 'short', label: 'Court métrage', desc: 'Moins de 40 min' },
  { value: 'documentary', label: 'Documentaire', desc: 'Tout format' },
  { value: 'series', label: 'Série', desc: 'Plusieurs épisodes' },
  { value: 'animation', label: 'Animation', desc: 'Tout format' },
]

const GENRE_OPTIONS: { value: ProjectGenre; label: string }[] = [
  { value: 'historical', label: 'Historique' },
  { value: 'epic', label: 'Épique' },
  { value: 'drama', label: 'Drame' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'documentary', label: 'Documentaire' },
  { value: 'fantasy', label: 'Fantastique' },
  { value: 'scifi', label: 'Science-fiction' },
  { value: 'comedy', label: 'Comédie' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const { addProject, setAuth, setProfile } = useMuseionStore()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<NewProjectForm>({
    title: '',
    type: 'feature',
    logline: '',
    visualAmbition: '',
    audience: '',
    duration: '',
    universe: '',
    genre: 'drama',
  })
  const [errors, setErrors] = useState<Partial<NewProjectForm>>({})

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (!session) { router.replace('/login'); return }
    setAuth(session)
    const profile = localAuthAdapter.getProfile()
    if (profile) setProfile(profile)
  }, [router, setAuth, setProfile])

  const session = localAuthAdapter.getSession()
  if (!session) return null

  const update = (key: keyof NewProjectForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateStep1 = () => {
    const errs: Partial<NewProjectForm> = {}
    if (!form.title.trim()) errs.title = 'Le titre est requis'
    if (!form.logline.trim()) errs.logline = 'La logline est requise'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  const handleCreate = () => {
    if (!validateStep1()) { setStep(1); return }
    const slug = slugify(form.title) || `projet-${Date.now()}`
    const project = addProject({
      slug,
      title: form.title,
      status: 'development',
      format: form.type,
      genre: form.genre,
      logline: form.logline,
      loglineHistory: form.logline ? [{
        id: `logv-${Date.now()}`,
        content: form.logline,
        wordCount: countWords(form.logline),
        savedAt: new Date().toISOString(),
        label: 'Version initiale',
      }] : [],
      vision: form.visualAmbition ? {
        promise: form.logline,
        intention: '',
        theme: '',
        world: form.universe,
        conflict: '',
        arc: '',
        tone: '',
        audience: form.audience,
        duration: form.duration,
        references: [],
      } : undefined,
      characters: [],
      traces: [],
      isFavorite: false,
      isArchived: false,
      completionPercent: 5,
    })
    router.push(`/cinema/projects/${project.slug}`)
  }

  // Blueprint dynamique
  const blueprint = {
    titre: form.title || '—',
    logline: form.logline || '—',
    format: form.type === 'feature' ? 'Long métrage' : form.type === 'short' ? 'Court métrage' : form.type === 'documentary' ? 'Documentaire' : form.type,
    genre: GENRE_OPTIONS.find((g) => g.value === form.genre)?.label ?? '—',
    durée: form.duration || '—',
    univers: form.universe || '—',
    public: form.audience || '—',
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      <CinemaSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-8 py-5">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Nouveau projet cinéma</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Posez les bases de votre prochain film ou documentaire.
          </p>
        </div>

        {/* Stepper */}
        <div className="px-8 pt-6">
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (s.id < step || (s.id === step + 1 && validateStep1())) setStep(s.id as Step)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    step === s.id
                      ? 'bg-[var(--accent-blue)] text-white'
                      : s.id < step
                      ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold',
                    step === s.id ? 'bg-white/20' : s.id < step ? 'bg-green-500 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  )}>
                    {s.id < step ? <Check size={10} /> : s.id}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-[var(--text-muted)] mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8 flex gap-6">
          {/* Formulaire */}
          <div className="flex-1 min-w-0">
            {step === 1 && (
              <div className="space-y-5">
                <Input
                  id="title"
                  label="Titre du projet"
                  placeholder="Ex : un nom de lieu, un personnage, 10 ans"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  error={errors.title}
                />
                <Textarea
                  id="logline"
                  label="Logline"
                  placeholder="Une phrase qui dit qui veut quoi, contre quoi, pourquoi ça compte."
                  value={form.logline}
                  onChange={(e) => update('logline', e.target.value)}
                  rows={3}
                  error={errors.logline}
                />
                {form.logline && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {countWords(form.logline)} mots
                  </p>
                )}
                <Textarea
                  id="visualAmbition"
                  label="Ambition visuelle"
                  placeholder="Comment voulez-vous que le film soit vu ?"
                  value={form.visualAmbition}
                  onChange={(e) => update('visualAmbition', e.target.value)}
                  rows={2}
                />
                <Input
                  id="audience"
                  label="Public"
                  placeholder="Ex : adultes sensibles aux grandes questions"
                  value={form.audience}
                  onChange={(e) => update('audience', e.target.value)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Type / Format */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                    Type
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {FORMAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => update('type', opt.value)}
                        className={cn(
                          'p-4 rounded-[var(--radius-lg)] border text-left transition-all',
                          form.type === opt.value
                            ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-dim)]'
                            : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                    Genre
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => update('genre', opt.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          form.genre === opt.value
                            ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]'
                            : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Durée et univers */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="duration"
                    label="Durée estimée"
                    placeholder="Ex : 30 min, 1h30, 2h15"
                    value={form.duration}
                    onChange={(e) => update('duration', e.target.value)}
                  />
                  <Input
                    id="universe"
                    label="Univers"
                    placeholder="Ex : Mésopotamie antique"
                    value={form.universe}
                    onChange={(e) => update('universe', e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Ajoutez des références visuelles ou textuelles pour guider votre projet.
                </p>
                <div className="border-2 border-dashed border-[var(--border-default)] rounded-[var(--radius-lg)] p-12 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Glissez des images ou cliquez pour sélectionner</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Import local d&apos;images — Sprint 2</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Vérifiez les informations avant de créer le projet.
                </p>
                <div className="rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-default)] p-5 space-y-3">
                  {Object.entries(blueprint).map(([key, val]) => (
                    <div key={key} className="flex gap-3">
                      <span className="text-xs text-[var(--text-muted)] w-20 shrink-0 capitalize">{key}</span>
                      <span className="text-sm text-[var(--text-primary)] flex-1">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
                disabled={step === 1}
              >
                Précédent
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.push('/cinema/projects')}>
                  Annuler
                </Button>
                {step < 4 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Suivant
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleCreate} disabled={!form.title.trim()}>
                    Créer le projet
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Blueprint initial */}
          <div className="w-64 shrink-0">
            <div className="sticky top-24 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-default)] p-5">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                Blueprint initial
              </p>
              <div className="space-y-3">
                {Object.entries(blueprint).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{key}</p>
                    <p className="text-xs text-[var(--text-primary)] mt-0.5 leading-relaxed">
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
