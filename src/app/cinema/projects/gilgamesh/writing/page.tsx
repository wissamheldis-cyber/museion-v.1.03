'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SprintPlaceholder } from '@/components/layout/SprintPlaceholder'

export default function WritingAssistancePage() {
  return (
    <AppShell projectSlug="gilgamesh">
      <SprintPlaceholder
        title="Assistance à l’écriture"
        projectSlug="gilgamesh"
        description="Studio de scénario : beats par acte, santé de structure, jauges de ton et de rythme, objectifs par personnage, et suggestions de réécriture. Référence : references/ref3.png."
        constraint="Le bloc de suggestions suppose un modèle de langage. Aucune API réelle n’est appelée en V1 et aucune clé ne figure dans le dépôt. Cette page restera vide tant qu’une autorisation explicite n’aura pas été donnée."
      />
    </AppShell>
  )
}
