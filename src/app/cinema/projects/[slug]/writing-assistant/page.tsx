'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function WritingAssistantPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Assistance à l’écriture"
          role="Révéler les trous de structure d’un scénario : beats par acte, santé de structure, jauges de ton et de rythme, objectifs par personnage."
          inputs={[
            'Traitement en trois actes',
            'Scénario découpé en scènes et en blocs',
            'Fiches personnages et leurs objectifs',
          ]}
          outputs={[
            'Beats ordonnés par acte',
            'Indicateurs de structure et de rythme',
            'Suggestions de réécriture, à accepter ou à refuser',
          ]}
          dependencies={[
            'Un modèle de langage, non branché',
            'Une autorisation humaine explicite avant tout appel réseau',
          ]}
          availableToday={[
            'L’onglet Scénario du Développement est pleinement éditable',
            'Aucune API n’est appelée et aucune clé ne figure dans le dépôt',
            'Rien n’est généré : la page annonce ce qu’elle fera, sans le simuler',
          ]}
          tourStepId="writing"
        />
      ) : (
        <ProjectNotFound slug={slug} />
      )}
    </AppShell>
  )
}
