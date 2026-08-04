'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function DeliverablesPage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Livrables"
        sprint={3}
        projectSlug="gilgamesh"
        description="Exports finaux : dossier de storyboard, liste de plans, feuille de service, contrats de prompt."
      />
    </AppShell>
  )
}
