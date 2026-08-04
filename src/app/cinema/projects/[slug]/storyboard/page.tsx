'use client'

import { AppShell } from '@/components/layout/AppShell'
import { ProjectNotFound } from '@/components/layout/ProjectNotFound'
import { useProjectScope } from '@/components/layout/useProjectFromRoute'
import { StoryboardWorkspace } from '@/components/storyboard/StoryboardWorkspace'

export default function StoryboardPage() {
  const scope = useProjectScope()

  return (
    <AppShell projectSlug={scope.slug}>
      {scope.project ? (
        <StoryboardWorkspace scope={scope} view="classic" />
      ) : (
        <ProjectNotFound slug={scope.slug} />
      )}
    </AppShell>
  )
}
