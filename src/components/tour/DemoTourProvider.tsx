'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useMuseionStore } from '@/store/museionStore'
import { getTour } from '@/lib/tour/gilgameshTour'
import type { DemoStep, DemoTour } from '@/lib/tour/types'

interface DemoTourContextValue {
  tour: DemoTour | undefined
  step: DemoStep | undefined
  index: number
  total: number
  /** Projet sur lequel la visite s'exécute. Aucun autre n'est touché. */
  projectId: string | null
  isActive: boolean
  isLast: boolean
  isFirst: boolean
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  skip: () => void
  exit: () => void
}

const DemoTourContext = createContext<DemoTourContextValue | null>(null)

export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  const tourState = useMuseionStore((s) => s.tour)
  const nextTourStep = useMuseionStore((s) => s.nextTourStep)
  const prevTourStep = useMuseionStore((s) => s.prevTourStep)
  const goToTourStep = useMuseionStore((s) => s.goToTourStep)
  const skipTour = useMuseionStore((s) => s.skipTour)
  const exitTour = useMuseionStore((s) => s.exitTour)
  const completeTour = useMuseionStore((s) => s.completeTour)

  const tour = getTour(tourState.activeTourId)
  const total = tour?.steps.length ?? 0
  const index = Math.min(tourState.stepIndex, Math.max(0, total - 1))
  const step = tour?.steps[index]
  const isLast = total > 0 && index === total - 1

  const next = useCallback(() => {
    if (isLast) completeTour()
    else nextTourStep(total)
  }, [isLast, completeTour, nextTourStep, total])

  const value = useMemo<DemoTourContextValue>(
    () => ({
      tour,
      step,
      index,
      total,
      projectId: tourState.projectId,
      isActive: Boolean(tour && step),
      isLast,
      isFirst: index === 0,
      next,
      prev: prevTourStep,
      goTo: goToTourStep,
      skip: skipTour,
      exit: exitTour,
    }),
    [tour, step, index, total, tourState.projectId, isLast, next, prevTourStep, goToTourStep, skipTour, exitTour]
  )

  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
}

export function useDemoTour(): DemoTourContextValue {
  const ctx = useContext(DemoTourContext)
  if (!ctx) throw new Error('useDemoTour doit être utilisé dans un DemoTourProvider')
  return ctx
}
