'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function DeliverablesPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Livrables"
          role="Préparer ce qui sort du studio : sélection des éléments retenus, validation finale, export et livraison."
          inputs={[
            'Assets canoniques',
            'Storyboard et liste de plans arrêtés',
            'Décisions de validation',
          ]}
          outputs={[
            'Dossier de storyboard exportable',
            'Liste de plans et feuille de service',
            'Contrats de prompt pour un moteur externe',
          ]}
          dependencies={[
            'Une étape de Review terminée',
            'Un format d’export arrêté, encore ouvert',
          ]}
          availableToday={[
            'Le contrat JSON destiné à un moteur externe est déjà composé et affichable',
            'Aucun export de fichier n’est implémenté',
          ]}
          tourStepId="deliverables"
          sprint={3}
        />
      ) : (
        <ProjectNotFound slug={slug} />
      )}
    </AppShell>
  )
}
