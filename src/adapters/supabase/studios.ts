import { createClient } from '@/lib/supabase/client'

function supabase() {
  return createClient()
}

export interface CurrentStudio {
  id: string
  name: string
  role: 'owner' | 'admin' | 'creator' | 'reviewer'
  /** null = illimité (réservé au studio admin, voir supabase/seed.sql). */
  projectLimit: number | null
}

/**
 * V1's UI has no studio switcher — a signed-in user works within a single
 * studio. Resolve it as the first membership found (owner/admin memberships
 * first, since that's the common "my own studio" case).
 */
export async function resolveCurrentStudio(): Promise<CurrentStudio | null> {
  const { data, error } = await supabase()
    .from('studio_members')
    .select('studio_id, role, studios(name, project_limit)')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const studios = data.studios as unknown as
    | { name: string; project_limit: number | null }
    | { name: string; project_limit: number | null }[]
    | null
  const studio = Array.isArray(studios) ? studios[0] : studios

  return {
    id: data.studio_id as string,
    role: data.role as CurrentStudio['role'],
    name: studio?.name ?? 'Studio',
    projectLimit: studio?.project_limit ?? null,
  }
}

export async function createStudioForCurrentUser(name: string): Promise<CurrentStudio> {
  const { data, error } = await supabase().rpc('create_studio', { p_name: name })
  if (error || !data) throw error ?? new Error('Échec de création du studio.')
  return {
    id: data.id as string,
    name: data.name as string,
    role: 'owner',
    projectLimit: (data as { project_limit?: number | null }).project_limit ?? 3,
  }
}
