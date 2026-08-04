'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMuseionStore } from '@/store/museionStore'
import { useDemoTour } from './DemoTourProvider'
import { DemoSpotlight } from './DemoSpotlight'
import { DemoCoachmark } from './DemoCoachmark'

const MARGIN = 16
const CARD_WIDTH = 360
const CARD_HEIGHT_ESTIMATE = 330

/**
 * Pilote la visite : suit la route de l'étape, mesure la cible, place
 * l'encart. La visite survit au changement de page et au rechargement,
 * puisque sa progression vit dans le store persisté.
 */
export function DemoTourController() {
  const { step, index, total, isActive, isFirst, isLast, projectId, next, prev, skip, exit } =
    useDemoTour()
  const projects = useMuseionStore((s) => s.projects)
  const pathname = usePathname()
  const router = useRouter()

  const [rect, setRect] = useState<DOMRect | null>(null)

  const project = projectId ? projects.find((p) => p.id === projectId) : undefined
  const slug = project?.slug

  // La visite navigue vers la route de l'étape courante
  useEffect(() => {
    if (!isActive || !step || !slug) return
    const target = step.route(slug)
    if (pathname !== target) router.push(target)
  }, [isActive, step, slug, pathname, router])

  // Mesure de l'élément mis en avant
  useEffect(() => {
    let frame = 0
    let attempts = 0

    const measure = () => {
      if (!isActive || !step || !step.target) {
        setRect(null)
        return
      }
      const el = document.querySelector(step.target)
      if (el) {
        setRect(el.getBoundingClientRect())
      } else if (attempts < 40) {
        // La page cible n'est pas encore montée : on réessaie brièvement.
        attempts += 1
        frame = window.requestAnimationFrame(measure)
      } else {
        setRect(null)
      }
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [isActive, step, pathname])

  if (!isActive || !step) return null

  return (
    <>
      <DemoSpotlight rect={rect} />
      <DemoCoachmark
        step={step}
        index={index}
        total={total}
        isFirst={isFirst}
        isLast={isLast}
        position={rect ? placeCard(rect) : null}
        onNext={next}
        onPrev={prev}
        onSkip={skip}
        onExit={exit}
      />
    </>
  )
}

/** Place l'encart à côté de la cible, sans jamais sortir de l'écran. */
function placeCard(rect: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = rect.left
  if (rect.right + MARGIN + CARD_WIDTH < vw) left = rect.right + MARGIN
  else if (rect.left - MARGIN - CARD_WIDTH > 0) left = rect.left - MARGIN - CARD_WIDTH
  left = Math.min(Math.max(MARGIN, left), vw - CARD_WIDTH - MARGIN)

  let top = rect.top
  if (top + CARD_HEIGHT_ESTIMATE > vh - MARGIN) top = vh - CARD_HEIGHT_ESTIMATE - MARGIN
  top = Math.max(MARGIN, top)

  return { top, left }
}
