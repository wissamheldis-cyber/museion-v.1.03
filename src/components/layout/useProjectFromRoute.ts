'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import type { Project, TraceItem } from '@/lib/types'
import type { Asset, Sequence, Shot, StoryboardEdge, StoryboardScene } from '@/lib/types-storyboard'

/** Slug de la route courante. Aucune valeur codée en dur. */
export function useProjectSlug(): string {
  const params = useParams<{ slug?: string | string[] }>()
  const raw = params?.slug
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
}

export interface ProjectScope {
  slug: string
  project: Project | undefined
  /** true tant que le store persisté n'a pas été réhydraté. */
  notFound: boolean
  sequences: Sequence[]
  scenes: StoryboardScene[]
  shots: Shot[]
  edges: StoryboardEdge[]
  assets: Asset[]
  traces: TraceItem[]
  isHydrating: boolean
}

/**
 * Résout le projet depuis le slug de la route et ne renvoie QUE les
 * données de ce projet. C'est le seul point d'entrée autorisé pour les
 * pages projet : il garantit l'isolation par projectId.
 */
export function useProjectScope(): ProjectScope {
  const slug = useProjectSlug()
  const projects = useMuseionStore((s) => s.projects)
  const allSequences = useMuseionStore((s) => s.sequences)
  const allScenes = useMuseionStore((s) => s.scenes)
  const allShots = useMuseionStore((s) => s.shots)
  const allEdges = useMuseionStore((s) => s.edges)
  const allAssets = useMuseionStore((s) => s.assets)
  const allTraces = useMuseionStore((s) => s.traces)
  const isV2Hydrated = useMuseionStore((s) => s.isV2Hydrated)

  const project = useMemo(() => projects.find((p) => p.slug === slug), [projects, slug])
  const projectId = project?.id

  const traces = useMemo(
    () => allTraces.filter((t) => t.projectId === projectId),
    [allTraces, projectId]
  )

  const sequences = useMemo(
    () =>
      allSequences
        .filter((q) => q.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [allSequences, projectId]
  )

  const scenes = useMemo(
    () => allScenes.filter((sc) => sc.projectId === projectId),
    [allScenes, projectId]
  )

  const shots = useMemo(
    () => allShots.filter((sh) => sh.projectId === projectId),
    [allShots, projectId]
  )

  const assets = useMemo(
    () => allAssets.filter((a) => a.projectId === projectId),
    [allAssets, projectId]
  )

  // Une connexion n'appartient au projet que si ses deux scènes en font partie.
  const edges = useMemo(() => {
    const ids = new Set(scenes.map((sc) => sc.id))
    return allEdges.filter((e) => ids.has(e.source) && ids.has(e.target))
  }, [allEdges, scenes])

  return {
    slug,
    project,
    notFound: Boolean(slug) && !project,
    traces,
    sequences,
    scenes,
    shots,
    edges,
    assets,
    isHydrating: !isV2Hydrated,
  }
}
