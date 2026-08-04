'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function LibraryPage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Bibliothèque"
        sprint={3}
        projectSlug="gilgamesh"
        description="Tous les assets du projet, filtrables par statut, type et scène, avec leurs versions et leurs relations."
      />
    </AppShell>
  )
}
