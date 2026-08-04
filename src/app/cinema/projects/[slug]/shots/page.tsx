'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectSlug } from '@/components/layout/useProjectFromRoute'

/** Ancienne route Sprint 1. Les plans techniques vivent sous /plans. */
export default function ShotsRedirectPage() {
  const router = useRouter()
  const slug = useProjectSlug()

  useEffect(() => {
    if (slug) router.replace(`/cinema/projects/${slug}/plans`)
  }, [router, slug])

  return null
}
