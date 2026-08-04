'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function PrevisPage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Previs"
        projectSlug="gilgamesh"
        description="Blocking d’une scène en volume : placement des décors et des personnages, tracés de déplacement, caméras avec leurs frustums, et timeline de plan image par image. Référence : references/ref4.png."
        constraint="Aucun viewport 3D n’existe aujourd’hui. Rien n’est affiché ici tant que le moteur de rendu n’est pas construit et chiffré : une image fixe ferait croire à une fonction qui n’existe pas."
      />
    </AppShell>
  )
}
