'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function LibraryPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Bibliothèque"
          role="Rassembler tous les assets du projet, filtrables par statut, type et scène, avec leurs versions et leurs relations."
          inputs={[
            'Assets validés et canoniques',
            'Références, personnages et décors',
            'Versions successives d’un même asset',
          ]}
          outputs={[
            'Vue unifiée des assets du projet',
            'Relations entre assets : référence, variation, dérivé',
            'Archivage réversible',
          ]}
          dependencies={[
            'Un volume d’assets réel, produit en Production',
          ]}
          availableToday={[
            'Le bac d’assets du tableau dynamique montre déjà les assets du projet',
            'Les archives temporaires listent les prévisualisations qui expirent',
            'Aucun fichier binaire n’est stocké : les vignettes sont des compositions locales',
          ]}
          tourStepId="review"
          sprint={3}
        />
      ) : (
        <ProjectNotFound slug={slug} />
      )}
    </AppShell>
  )
}
