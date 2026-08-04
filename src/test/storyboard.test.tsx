import { describe, it, expect, beforeEach } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import { useMuseionStore } from '@/store/museionStore'
import { ClassicView } from '@/components/storyboard/ClassicView'
import { AssetBin } from '@/components/storyboard/AssetBin'
import { DEMO_SEQUENCES } from '@/lib/demo-storyboard'

const SEQ_1 = 'seq-01'

function store() {
  return useMuseionStore.getState()
}

function sequenceScenes(sequenceId = SEQ_1) {
  return store()
    .scenes.filter((scene) => scene.sequenceId === sequenceId)
    .sort((a, b) => a.order - b.order)
}

beforeEach(() => {
  act(() => {
    store().resetToDemo()
  })
})

describe('Storyboard — structure de démonstration', () => {
  it('expose cinq séquences et au moins huit scènes', () => {
    expect(store().sequences).toHaveLength(5)
    expect(store().scenes.length).toBeGreaterThanOrEqual(8)
    expect(sequenceScenes(SEQ_1).length).toBeGreaterThanOrEqual(8)
  })

  it('rattache chaque scène à une séquence existante', () => {
    const ids = new Set(DEMO_SEQUENCES.map((s) => s.id))
    for (const scene of store().scenes) {
      expect(ids.has(scene.sequenceId)).toBe(true)
    }
  })

  it('rattache chaque plan à une scène existante', () => {
    const sceneIds = new Set(store().scenes.map((s) => s.id))
    for (const shot of store().shots) {
      expect(sceneIds.has(shot.sceneId)).toBe(true)
    }
  })
})

describe('Storyboard — vue classique et Canvas partagent le même store', () => {
  function Harness() {
    const sequences = useMuseionStore((s) => s.sequences)
    const scenes = useMuseionStore((s) => s.scenes)
    const assets = useMuseionStore((s) => s.assets)
    const selectedSceneId = useMuseionStore((s) => s.selectedSceneId)
    const selectScene = useMuseionStore((s) => s.selectScene)

    // Ce que consomme le Canvas : les mêmes scènes, avec leurs positions
    const canvasNodes = scenes
      .filter((scene) => scene.sequenceId === SEQ_1)
      .sort((a, b) => a.order - b.order)

    return (
      <div>
        <div data-testid="classic">
          <ClassicView
            sequences={sequences}
            scenes={scenes}
            assets={assets}
            activeSequenceId={SEQ_1}
            selectedSceneId={selectedSceneId}
            onActiveSequenceChange={() => {}}
            onSelectScene={selectScene}
            onAddScene={() => {}}
            onDuplicateScene={() => {}}
            onDeleteScene={() => {}}
            onMoveSceneToSequence={() => {}}
            onReorder={() => {}}
          />
        </div>
        <ul data-testid="canvas">
          {canvasNodes.map((scene) => (
            <li key={scene.id} data-position={`${scene.canvasPosition.x},${scene.canvasPosition.y}`}>
              {scene.title}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  it('affiche les mêmes scènes dans les deux vues et propage les modifications', () => {
    render(<Harness />)

    const classic = screen.getByTestId('classic')
    const canvas = screen.getByTestId('canvas')

    const firstTitle = sequenceScenes()[0].title
    expect(within(classic).getAllByText(firstTitle).length).toBeGreaterThan(0)
    expect(within(canvas).getByText(firstTitle)).toBeInTheDocument()

    // Une modification du store est vue par les deux vues
    act(() => {
      store().updateScene(sequenceScenes()[0].id, { title: 'Titre partagé' })
    })

    expect(within(classic).getAllByText('Titre partagé').length).toBeGreaterThan(0)
    expect(within(canvas).getByText('Titre partagé')).toBeInTheDocument()
  })

  it('reflète immédiatement une réorganisation faite depuis la vue classique', () => {
    render(<Harness />)
    const canvas = screen.getByTestId('canvas')

    const before = sequenceScenes().map((s) => s.id)
    const reordered = [before[1], before[0], ...before.slice(2)]

    act(() => {
      store().reorderScenes(SEQ_1, reordered)
    })

    const after = sequenceScenes().map((s) => s.id)
    expect(after).toEqual(reordered)

    const rendered = within(canvas)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(rendered[0]).toBe(store().scenes.find((s) => s.id === reordered[0])?.title)
  })

  it('reflète une position déplacée sur le Canvas', () => {
    render(<Harness />)
    const sceneId = sequenceScenes()[0].id

    act(() => {
      store().setSceneCanvasPosition(sceneId, { x: 999, y: 42 })
    })

    const item = screen.getByTestId('canvas').querySelector('li')
    expect(item?.getAttribute('data-position')).toBe('999,42')
  })
})

describe('Storyboard — scènes', () => {
  it('ajoute une scène à la fin de la séquence', () => {
    const before = sequenceScenes().length
    act(() => {
      store().addScene(SEQ_1, { title: 'Scène ajoutée' })
    })
    const after = sequenceScenes()
    expect(after).toHaveLength(before + 1)
    expect(after[after.length - 1].title).toBe('Scène ajoutée')
    expect(store().selectedSceneId).toBe(after[after.length - 1].id)
  })

  it('duplique une scène sans toucher à l’originale', () => {
    const source = sequenceScenes()[0]
    act(() => {
      store().duplicateScene(source.id)
    })
    const copy = store().scenes.find((s) => s.title === `${source.title} (copie)`)
    expect(copy).toBeDefined()
    expect(copy?.id).not.toBe(source.id)
    expect(store().scenes.find((s) => s.id === source.id)?.title).toBe(source.title)
  })

  it('déplace une scène vers une autre séquence', () => {
    const scene = sequenceScenes()[0]
    act(() => {
      store().moveSceneToSequence(scene.id, 'seq-03')
    })
    expect(store().scenes.find((s) => s.id === scene.id)?.sequenceId).toBe('seq-03')
  })

  it('réorganise les scènes d’une séquence', () => {
    const ids = sequenceScenes().map((s) => s.id)
    const reversed = [...ids].reverse()
    act(() => {
      store().reorderScenes(SEQ_1, reversed)
    })
    expect(sequenceScenes().map((s) => s.id)).toEqual(reversed)
  })

  it('supprime une scène, ses plans et ses connexions, mais conserve l’asset', () => {
    const scene = store().scenes.find((s) => s.id === 'sb-scene-01')!
    const assetId = scene.assetId
    expect(assetId).toBeDefined()

    act(() => {
      store().removeScene(scene.id)
    })

    expect(store().scenes.find((s) => s.id === scene.id)).toBeUndefined()
    expect(store().shots.some((shot) => shot.sceneId === scene.id)).toBe(false)
    expect(store().edges.some((e) => e.source === scene.id || e.target === scene.id)).toBe(false)

    const asset = store().assets.find((a) => a.id === assetId)
    expect(asset).toBeDefined()
    expect(asset?.status).not.toBe('deleted')
    expect(asset?.sceneId).toBeUndefined()
  })
})

describe('Storyboard — connexions du Canvas', () => {
  it('crée une connexion séquentielle', () => {
    const before = store().edges.length
    act(() => {
      store().addEdge('sb-scene-01', 'sb-scene-05', 'sequential')
    })
    expect(store().edges).toHaveLength(before + 1)
  })

  it('crée une branche alternative avec un libellé', () => {
    act(() => {
      store().addEdge('sb-scene-02', 'sb-scene-06', 'alternative', 'Variante montage')
    })
    const edge = store().edges.find((e) => e.source === 'sb-scene-02' && e.target === 'sb-scene-06')
    expect(edge?.type).toBe('alternative')
    expect(edge?.label).toBe('Variante montage')
  })

  it('refuse une connexion sur elle-même ou en doublon', () => {
    const before = store().edges.length
    act(() => {
      store().addEdge('sb-scene-01', 'sb-scene-01', 'sequential')
      store().addEdge('sb-scene-01', 'sb-scene-05', 'sequential')
      store().addEdge('sb-scene-01', 'sb-scene-05', 'sequential')
    })
    expect(store().edges).toHaveLength(before + 1)
  })

  it('supprime une connexion sans jamais supprimer les scènes reliées', () => {
    const edge = store().edges[0]
    const sceneCount = store().scenes.length

    act(() => {
      store().removeEdge(edge.id)
    })

    expect(store().edges.find((e) => e.id === edge.id)).toBeUndefined()
    expect(store().scenes).toHaveLength(sceneCount)
    expect(store().scenes.find((s) => s.id === edge.source)).toBeDefined()
    expect(store().scenes.find((s) => s.id === edge.target)).toBeDefined()
  })
})

describe('Storyboard — Canvas et persistance', () => {
  it('enregistre la position d’une scène', () => {
    const sceneId = sequenceScenes()[0].id

    act(() => {
      store().setSceneCanvasPosition(sceneId, { x: 512, y: 256 })
    })

    expect(store().scenes.find((s) => s.id === sceneId)?.canvasPosition).toEqual({
      x: 512,
      y: 256,
    })
  })

  it('enregistre le viewport du Canvas', () => {
    act(() => {
      store().setCanvasViewport({ x: -120, y: 40, zoom: 1.25 })
    })
    expect(store().canvasViewport).toEqual({ x: -120, y: 40, zoom: 1.25 })
  })

  it('réinitialise la disposition sur la grille par défaut', () => {
    const sceneId = sequenceScenes()[0].id
    act(() => {
      store().setSceneCanvasPosition(sceneId, { x: 4242, y: 4242 })
      store().resetCanvasLayout()
    })
    expect(store().scenes.find((s) => s.id === sceneId)?.canvasPosition).toEqual({ x: 80, y: 80 })
    expect(store().canvasViewport.zoom).toBe(0.75)
  })
})

describe('Storyboard — glisser un asset sur une scène', () => {
  it('rattache l’asset à la scène et la scène à l’asset', () => {
    const scene = store().scenes.find((s) => s.id === 'sb-scene-05')!
    expect(scene.assetId).toBeUndefined()

    act(() => {
      store().attachAssetToScene('asset-char-enkidu', scene.id)
    })

    expect(store().scenes.find((s) => s.id === scene.id)?.assetId).toBe('asset-char-enkidu')
    expect(store().assets.find((a) => a.id === 'asset-char-enkidu')?.sceneId).toBe(scene.id)
  })

  it('expose les assets du bac comme éléments manipulables', () => {
    render(<AssetBin assets={store().assets} onOpenArchives={() => {}} />)
    const items = screen.getAllByRole('button', { name: /^Asset / })
    expect(items.length).toBeGreaterThan(0)
  })
})

describe('Storyboard — plans techniques', () => {
  it('ajoute un plan rattaché à une scène', () => {
    const before = store().shots.length
    act(() => {
      store().addShot('sb-scene-03')
    })
    expect(store().shots).toHaveLength(before + 1)
    const shot = store().shots[store().shots.length - 1]
    expect(shot.sceneId).toBe('sb-scene-03')
    expect(shot.validated).toBe(false)
  })

  it('valide, duplique puis supprime un plan', () => {
    const shot = store().shots[0]

    act(() => {
      store().setShotValidated(shot.id, false)
    })
    expect(store().shots.find((s) => s.id === shot.id)?.validated).toBe(false)

    act(() => {
      store().setShotValidated(shot.id, true)
    })
    expect(store().shots.find((s) => s.id === shot.id)?.validated).toBe(true)

    act(() => {
      store().duplicateShot(shot.id)
    })
    const copy = store().shots[store().shots.length - 1]
    expect(copy.id).not.toBe(shot.id)
    expect(copy.validated).toBe(false)

    act(() => {
      store().removeShot(copy.id)
    })
    expect(store().shots.find((s) => s.id === copy.id)).toBeUndefined()
  })
})
