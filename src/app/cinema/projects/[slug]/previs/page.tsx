'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function PrevisPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Prévis"
          role="Poser le découpage en volume avant d’engager une équipe : décors, personnages, tracés de déplacement, caméras et leurs frustums, sur une timeline image par image."
          inputs={[
            'Scènes validées du storyboard',
            'Plans techniques : focale, hauteur, angle, mouvement',
            'Décors et repères de continuité',
          ]}
          outputs={[
            'Blocking par scène',
            'Trajectoires de caméra et de personnage',
            'Durées mesurées plutôt qu’estimées',
          ]}
          dependencies={[
            'Un moteur de rendu 3D dans le navigateur, non construit',
            'Des volumes de décor, absents du modèle actuel',
          ]}
          availableToday={[
            'Les plans portent déjà focale, hauteur, angle, mouvement et cadence',
            'Aucun viewport 3D : rien n’est affiché ici plutôt qu’une image fixe trompeuse',
          ]}
          tourStepId="previs"
        />
      ) : (
        <ProjectNotFound slug={slug} />
      )}
    </AppShell>
  )
}
