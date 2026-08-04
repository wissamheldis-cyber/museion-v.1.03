'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function ProductionPage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Production visuelle"
        sprint={3}
        projectSlug="gilgamesh"
        description="File de génération image et vidéo à partir des plans validés : suivi des travaux, reprises, comparaison des versions."
        constraint="Aucun moteur de génération n’est branché. Le seul fournisseur actif reste le compositeur SVG local, et il ne quitte pas le poste."
      />
    </AppShell>
  )
}
