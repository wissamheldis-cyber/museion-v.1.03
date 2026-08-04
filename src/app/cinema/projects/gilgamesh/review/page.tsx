'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function ReviewPage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Review & validations"
        sprint={3}
        projectSlug="gilgamesh"
        description="Comparaison A/B des versions, fil de commentaires par plan, et liste de contrôle avant passage en canonique."
      />
    </AppShell>
  )
}
