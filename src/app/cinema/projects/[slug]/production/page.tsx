'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function ProductionPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Production"
          role="Suivre ce qui coûte du temps machine : file de travaux, statuts, reprises, erreurs, et assets temporaires en attente de validation humaine."
          inputs={[
            'Plans validés et leurs prompts composés',
            'Décors, personnages et références canoniques',
            'Un moteur de génération autorisé',
          ]}
          outputs={[
            'Travaux d’image et de vidéo, avec leur statut',
            'Assets temporaires rattachés à une scène ou à un plan',
            'Journal des relances et des échecs',
          ]}
          dependencies={[
            'Un moteur de génération, aucun n’est branché',
            'Une autorisation humaine explicite avant tout appel',
          ]}
          availableToday={[
            'La file est vide et le reste : aucun travail n’est déclenché',
            'Le cycle de vie des assets est déjà appliqué, expiration comprise',
            'Le seul générateur actif est le compositeur SVG local',
          ]}
          tourStepId="production"
          sprint={3}
        />
      ) : (
        <ProjectNotFound slug={slug} />
      )}
    </AppShell>
  )
}
