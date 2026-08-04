'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StageOverview } from '@/components/layout/StageOverview'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'

export default function ReviewPage() {
  const { slug, project } = useProjectScope()

  return (
    <AppShell projectSlug={slug}>
      {project ? (
        <StageOverview
          project={project}
          title="Review & validations"
          role="Confronter les versions et trancher : comparaison A/B, commentaires situés sur un plan, liste de contrôle avant passage en canonique."
          inputs={[
            'Assets produits et leurs versions',
            'Plans et scènes de référence',
            'Règles de continuité du projet',
          ]}
          outputs={[
            'Décisions de validation tracées',
            'Assets promus en canonique par action humaine',
            'Commentaires rattachés à un plan',
          ]}
          dependencies={[
            'Des versions à comparer, produites en Production',
          ]}
          availableToday={[
            'Les statuts d’asset existent : temporaire, candidat, validé, canonique, archivé, supprimé',
            'Un asset supprimé ne peut plus jamais redevenir validé',
            'Le journal des décisions est déjà alimenté',
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
