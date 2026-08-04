import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMuseionStore } from '@/store/museionStore'
import NewProjectPage from '@/app/cinema/projects/new/page'
import * as projectsRemote from '@/adapters/supabase/projects'

// AppShell fait sa propre vérification de session (redirection /login, etc.)
// — hors sujet ici : on ne teste que le formulaire de création.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}))

vi.mock('@/adapters/supabase/studios', () => ({
  resolveCurrentStudio: vi.fn().mockResolvedValue(null),
  createStudioForCurrentUser: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/projects', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
  createProjectRemote: vi.fn().mockResolvedValue(undefined),
  deleteProjectRemote: vi.fn().mockResolvedValue(undefined),
  updateProjectCoreRemote: vi.fn().mockResolvedValue(undefined),
  upsertProjectCanonRemote: vi.fn().mockResolvedValue(undefined),
  addLoglineVersionRemote: vi.fn().mockResolvedValue(undefined),
  upsertCharacterRemote: vi.fn().mockResolvedValue(undefined),
  deleteCharacterRemote: vi.fn().mockResolvedValue(undefined),
  replaceScriptScenesRemote: vi.fn().mockResolvedValue(undefined),
  addTraceRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/storyboard', () => ({
  fetchStoryboard: vi.fn().mockResolvedValue({ sequences: [], scenes: [], shots: [], edges: [] }),
  createSequenceRemote: vi.fn().mockResolvedValue(undefined),
  updateSequenceRemote: vi.fn().mockResolvedValue(undefined),
  deleteSequenceRemote: vi.fn().mockResolvedValue(undefined),
  createSceneRemote: vi.fn().mockResolvedValue(undefined),
  updateSceneRemote: vi.fn().mockResolvedValue(undefined),
  deleteSceneRemote: vi.fn().mockResolvedValue(undefined),
  createShotRemote: vi.fn().mockResolvedValue(undefined),
  updateShotRemote: vi.fn().mockResolvedValue(undefined),
  deleteShotRemote: vi.fn().mockResolvedValue(undefined),
  createEdgeRemote: vi.fn().mockResolvedValue(undefined),
  deleteEdgeRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/assets', () => ({
  fetchAssets: vi.fn().mockResolvedValue({ assets: [], journal: [] }),
  createAssetRemote: vi.fn().mockResolvedValue(undefined),
  updateAssetRemote: vi.fn().mockResolvedValue(undefined),
  addAssetVersionRemote: vi.fn().mockResolvedValue(undefined),
  addJournalEntryRemote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/adapters/supabase/sprint4', () => ({
  fetchSprint4: vi.fn().mockResolvedValue({
    writingMissions: [], writingMessages: [], writingVariants: [], productionJobs: [],
    reviewComments: [], reviewChecklists: [], deliverablePackages: [], assetCollections: [],
  }),
}))

const TEST_STUDIO_ID = 'studio-test-0000-0000-000000000000'

async function fillStep1AndAdvance(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Titre du projet'), 'TEST PERSISTENCE SHOU')
  await user.type(
    screen.getByLabelText('Logline'),
    'Un test minimal pour vérifier la persistance après création.'
  )
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  // Étape 2 (Format) → étape 3 (Références) → étape 4 (Validation)
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  pushMock.mockClear()
  act(() => {
    useMuseionStore.setState({
      projects: [],
      currentStudioId: TEST_STUDIO_ID,
      currentStudioRole: 'owner',
    })
  })
})

describe('Assistant de création de projet — gestion des erreurs (bug persistance)', () => {
  it('création réussie : navigue vers le projet, une seule fois', async () => {
    const user = userEvent.setup()
    render(<NewProjectPage />)
    await fillStep1AndAdvance(user)

    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1))
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cinema\/projects\/test-persistence-shou/)
    )
    expect(useMuseionStore.getState().projects.some((p) => p.title === 'TEST PERSISTENCE SHOU')).toBe(true)
  })

  it('studioId absent : erreur visible, pas de navigation, rien de créé', async () => {
    act(() => {
      useMuseionStore.setState({ currentStudioId: null })
    })
    const user = userEvent.setup()
    render(<NewProjectPage />)
    await fillStep1AndAdvance(user)

    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))

    await waitFor(() => {
      expect(screen.getByText(/Aucun studio actif/i)).toBeInTheDocument()
    })
    expect(pushMock).not.toHaveBeenCalled()
    expect(useMuseionStore.getState().projects).toHaveLength(0)
    // Toujours à l'étape 4, pas de reset silencieux vers l'étape 1.
    expect(screen.getByText('Vérifiez les informations avant de créer le projet.')).toBeInTheDocument()
  })

  it('insertion Supabase refusée : erreur visible, mise à jour optimiste annulée, formulaire conservé', async () => {
    vi.mocked(projectsRemote.createProjectRemote).mockRejectedValueOnce(
      new Error('new row violates row-level security policy for table "projects"')
    )
    const user = userEvent.setup()
    render(<NewProjectPage />)
    await fillStep1AndAdvance(user)

    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))

    await waitFor(() => {
      expect(screen.getByText(/échoué côté serveur/i)).toBeInTheDocument()
    })
    // Pas de reset silencieux : ni de navigation, ni de retour à l'étape 1.
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Vérifiez les informations avant de créer le projet.')).toBeInTheDocument()
    // Rollback : le projet optimiste ne reste pas dans le store.
    expect(useMuseionStore.getState().projects).toHaveLength(0)
  })

  it('après un échec, les valeurs saisies restent affichées si on revient en arrière', async () => {
    act(() => {
      useMuseionStore.setState({ currentStudioId: null })
    })
    const user = userEvent.setup()
    render(<NewProjectPage />)
    await fillStep1AndAdvance(user)
    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))
    await waitFor(() => expect(screen.getByText(/Aucun studio actif/i)).toBeInTheDocument())

    // On navigue manuellement vers l'étape 1 : le titre et la logline saisis
    // doivent toujours être là (rien n'a été effacé par l'échec).
    await user.click(screen.getByRole('button', { name: 'Précédent' }))
    await user.click(screen.getByRole('button', { name: 'Précédent' }))
    await user.click(screen.getByRole('button', { name: 'Précédent' }))
    expect(screen.getByLabelText('Titre du projet')).toHaveValue('TEST PERSISTENCE SHOU')
    expect(screen.getByLabelText('Logline')).toHaveValue(
      'Un test minimal pour vérifier la persistance après création.'
    )
  })

  it('permet de réessayer après un échec, sans recharger la page', async () => {
    vi.mocked(projectsRemote.createProjectRemote).mockRejectedValueOnce(new Error('erreur réseau simulée'))
    const user = userEvent.setup()
    render(<NewProjectPage />)
    await fillStep1AndAdvance(user)

    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))
    await waitFor(() => expect(screen.getByText(/échoué côté serveur/i)).toBeInTheDocument())

    // Deuxième tentative, cette fois sans mock d'échec : doit réussir.
    await user.click(screen.getByRole('button', { name: 'Créer le projet' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1))
    expect(useMuseionStore.getState().projects.some((p) => p.title === 'TEST PERSISTENCE SHOU')).toBe(true)
  })
})
