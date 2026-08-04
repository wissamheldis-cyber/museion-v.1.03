// ============================================================
// MUSEION — ProjectBootstrapper
// Initialisation déterministe d'un projet. Aucune IA, aucun réseau.
// Rien n'est inventé : tout ce qui est écrit vient du formulaire.
// ============================================================

import { z } from 'zod'
import type {
  Decision,
  Hypothesis,
  OpenQuestion,
  Project,
  ProjectFormat,
  ProjectGenre,
  TraceItem,
} from '@/lib/types'
import { createWorkflow, workflowProgress } from '@/lib/workflow'
import { countWords, generateId, slugify, FORMAT_LABELS, GENRE_LABELS } from '@/lib/utils'

// ---- Validation ----

export const PROJECT_FORMATS = [
  'feature',
  'short',
  'documentary',
  'series',
  'animation',
] as const satisfies readonly ProjectFormat[]

export const PROJECT_GENRES = [
  'historical',
  'epic',
  'drama',
  'thriller',
  'documentary',
  'fantasy',
  'scifi',
  'comedy',
] as const satisfies readonly ProjectGenre[]

export const newProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Le titre doit contenir au moins 2 caractères.')
    .max(80, 'Le titre ne doit pas dépasser 80 caractères.'),
  logline: z
    .string()
    .trim()
    .min(10, 'La logline doit contenir au moins 10 caractères.')
    .max(400, 'La logline ne doit pas dépasser 400 caractères.'),
  format: z.enum(PROJECT_FORMATS),
  genre: z.enum(PROJECT_GENRES),
  duration: z.string().trim().max(40).optional().default(''),
  audience: z.string().trim().max(200).optional().default(''),
  universe: z.string().trim().max(400).optional().default(''),
  visualAmbition: z.string().trim().max(400).optional().default(''),
})

export type NewProjectInput = z.input<typeof newProjectSchema>
export type NewProjectData = z.output<typeof newProjectSchema>

export type FieldErrors = Partial<Record<keyof NewProjectData, string>>

export function validateNewProject(
  input: NewProjectInput
): { ok: true; data: NewProjectData } | { ok: false; errors: FieldErrors } {
  const result = newProjectSchema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }

  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof NewProjectData | undefined
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}

// ---- Slug unique ----

/**
 * Slug dérivé du titre, suffixé si nécessaire. Déterministe pour un
 * ensemble de slugs existants donné.
 */
export function uniqueSlug(title: string, existingSlugs: string[]): string {
  const base = slugify(title) || 'projet'
  const taken = new Set(existingSlugs)
  if (!taken.has(base)) return base

  let index = 2
  while (taken.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

// ---- Amorçage ----

export interface BootstrapOptions {
  existingSlugs: string[]
  /** Injecté dans les tests pour un résultat reproductible. */
  now?: string
  id?: string
}

/**
 * Construit un projet complet et cohérent à partir des seules données
 * saisies. Les suggestions produites sont des hypothèses ou des questions
 * ouvertes — jamais des décisions artistiques prises à la place de l'humain.
 */
export function bootstrapProject(data: NewProjectData, options: BootstrapOptions): Project {
  const now = options.now ?? new Date().toISOString()
  const id = options.id ?? generateId()
  const slug = uniqueSlug(data.title, options.existingSlugs)
  const workflow = createWorkflow({ idea: 'done', script: 'in-progress' })

  return {
    id,
    slug,
    title: data.title,
    status: 'development',
    format: data.format,
    genre: data.genre,
    logline: data.logline,
    loglineHistory: [
      {
        id: generateId(),
        content: data.logline,
        wordCount: countWords(data.logline),
        savedAt: now,
        label: 'Version initiale',
      },
    ],
    vision: {
      promise: data.logline,
      intention: '',
      theme: '',
      world: data.universe ?? '',
      conflict: '',
      arc: '',
      tone: '',
      audience: data.audience ?? '',
      duration: data.duration ?? '',
      references: [],
    },
    characters: [],
    // Le canon part de ce que l'humain a réellement écrit.
    canon: { logline: data.logline },
    workflow,
    traces: buildInitialTraces(data, now),
    isFavorite: false,
    isArchived: false,
    completionPercent: workflowProgress(workflow),
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now,
  }
}

/**
 * Traces initiales : deux décisions purement factuelles (ce que l'humain
 * vient de choisir), des hypothèses structurelles à valider, et les
 * questions que le projet laisse ouvertes.
 */
function buildInitialTraces(data: NewProjectData, now: string): TraceItem[] {
  const decisions: Decision[] = [
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'decision',
      content: `Format retenu : ${FORMAT_LABELS[data.format]}.`,
      context: 'Choisi à la création du projet.',
      date: now,
    },
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'decision',
      content: `Genre retenu : ${GENRE_LABELS[data.genre]}.`,
      context: 'Choisi à la création du projet.',
      date: now,
    },
  ]

  const hypotheses: Hypothesis[] = [
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'hypothesis',
      content: 'La logline initiale tiendra jusqu’au traitement.',
      toValidate: 'À confirmer une fois le traitement en trois actes écrit.',
      date: now,
    },
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'hypothesis',
      content: 'La structure suivra le découpage séquence → scène → plan.',
      toValidate: 'À confirmer à la première séquence de storyboard.',
      date: now,
    },
  ]

  if (data.duration) {
    hypotheses.push({
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'hypothesis',
      content: `Durée cible : ${data.duration}.`,
      toValidate: 'À confirmer après le traitement.',
      date: now,
    })
  }

  const questions: OpenQuestion[] = [
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'open-question',
      content: 'Quelle est l’intention de mise en scène en une phrase ?',
      priority: 'high',
      date: now,
    },
    {
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'open-question',
      content: 'Quel est le thème, distinct du sujet ?',
      priority: 'medium',
      date: now,
    },
  ]

  if (!data.audience) {
    questions.push({
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'open-question',
      content: 'À quel public ce projet s’adresse-t-il ?',
      priority: 'medium',
      date: now,
    })
  }

  if (!data.universe) {
    questions.push({
      id: generateId(),
      projectId: 'gilgamesh',
    status: 'open-question',
      content: 'Dans quel monde et à quelle époque le récit se déroule-t-il ?',
      priority: 'medium',
      date: now,
    })
  }

  return [...decisions, ...hypotheses, ...questions]
}
