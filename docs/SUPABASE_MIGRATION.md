# Bascule vers Supabase — plan de travail

> **Rien n'est installé ni appelé aujourd'hui.** Ce document décrit uniquement ce qu'il faudra
> changer, et surtout ce qu'il ne faudra **pas** toucher.

## Principe

L'interface ne doit pas être reconstruite. Elle ne connaît ni `localStorage`, ni Supabase :
elle appelle des actions du store. La bascule se joue donc entièrement **sous** le store.

```
Aujourd'hui                        Après bascule
─────────────                      ─────────────
Pages / composants                 Pages / composants        ← inchangés
     ↓                                  ↓
museionStore (Zustand)             museionStore (Zustand)    ← même API d'actions
     ↓                                  ↓
persist → localStorage             DataAdapter
                                        ↓
                                   SupabaseDataAdapter → Postgres + Storage
```

## Ce qui ne change pas

- Les types de `src/lib/types.ts` et `src/lib/types-storyboard.ts` : ils portent déjà `id`,
  `projectId`, `createdAt`, et sont sérialisables tels quels.
- Les règles pures `src/lib/assetLifecycle.ts` et `src/lib/promptComposer.ts` : aucune dépendance
  au stockage, elles restent valables côté client comme côté serveur.
- Les bases de connaissances `src/knowledge/*` : modules statiques versionnés avec le code.
- Tous les composants de `src/components/storyboard/` et `src/components/plans/`.
- `AuthAdapter` : le contrat `FutureSupabaseAuthAdapterContract` existe déjà.

## Changements nécessaires

### 1. Extraire un `DataAdapter` (préalable indispensable)

Créer `src/adapters/data/DataAdapter.ts` sur le modèle de `AuthAdapter`, puis
`LocalDataAdapter` (comportement actuel) et plus tard `SupabaseDataAdapter`.

```ts
export interface DataAdapter {
  loadWorkspace(projectId: string): Promise<WorkspaceSnapshot>
  saveScene(scene: StoryboardScene): Promise<void>
  deleteScene(sceneId: string): Promise<void>
  saveShot(shot: Shot): Promise<void>
  saveEdge(edge: StoryboardEdge): Promise<void>
  deleteEdge(edgeId: string): Promise<void>
  saveAsset(asset: Asset): Promise<void>
  uploadAssetBinary(file: Blob, path: string): Promise<string> // renvoie une URL
  appendJournal(entry: AssetJournalEntry): Promise<void>
}
```

### 2. Rendre les actions du store asynchrones

Les actions sont aujourd'hui synchrones (`addScene`, `updateScene`, `removeScene`, `addEdge`,
`removeEdge`, `addShot`, `setAssetStatus`, `restoreAndApproveAsset`…). Passer en
« optimistic update » : muter l'état local immédiatement, appeler l'adapter, restaurer en cas
d'échec. Les composants qui ignorent la valeur de retour ne changent pas ; les rares appels qui
lisent un retour (`registerPreview`, `setAssetStatus`, `restoreAndApproveAsset`) devront être
attendus avec `await`.

### 3. Filtrer par `projectId` (à faire avant tout second projet)

Aujourd'hui les vues lisent `scenes` / `shots` / `assets` en entier. Avec une base multi-projets,
il faut :
- soit charger un seul projet à la fois dans le store (`loadWorkspace(projectId)`),
- soit filtrer dans les sélecteurs.

Supprimer les deux replis `'proj-gilgamesh'` de `addScene` et `addShot`.

### 4. Passer les routes en `[slug]`

Remplacer les 9 dossiers `app/cinema/projects/gilgamesh/…` par `app/cinema/projects/[slug]/…`.
Les pages utilisent déjà une variable `projectSlug` transmise aux composants : seule la source
de cette variable change (`useParams()` au lieu de la constante `'gilgamesh'`).

### 5. Sortir les binaires du store

`Asset.url` contient un data URI SVG (~4,9 Ko pièce, ~54 Ko sur 10 assets). Avec de vraies images
`localStorage` sature vite (quota ~5 Mo). À la bascule :
- téléverser dans **Supabase Storage**, ne garder que le chemin et l'URL signée dans la ligne ;
- garder `MockPreviewProvider` capable de produire un SVG à la volée pour les scènes sans asset
  (`sceneThumbUrl` le fait déjà en repli, sans rien stocker).

### 6. Schéma Postgres

Une table par entité, clés étrangères et `on delete cascade` cohérents avec le comportement
actuel du store :

| Table | Points d'attention |
|---|---|
| `projects` | `slug` unique par studio |
| `sequences` | FK `project_id` |
| `scenes` | FK `sequence_id`, `project_id`, colonnes `canvas_x` / `canvas_y`, `order` |
| `shots` | FK `scene_id`; `cascade` à la suppression d'une scène (comportement actuel) |
| `edges` | FK `source`/`target` → `scenes`; `cascade` **uniquement** dans ce sens : supprimer une connexion ne doit jamais toucher une scène |
| `assets` | `status` en `enum`, contrainte empêchant toute sortie de `deleted` |
| `asset_versions`, `asset_relations` | FK `asset_id` |
| `asset_journal` | append-only, jamais de `update` ni de `delete` |

Reproduire les règles critiques côté base, pas seulement côté client :
un trigger interdisant `deleted → *`, et une politique RLS par studio.

### 7. Migration des données existantes

Le store persiste déjà `schemaVersion: 2` avec une fonction `migrate`. Prévoir un import unique
qui lit le blob `museion-store-v1` du navigateur et le pousse vers Supabase, puis marque la
migration comme faite (`schemaVersion: 3`).

### 8. Configuration

- `.env.local` pour `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Aucune clé de service dans le dépôt ni dans le bundle client.
- Ajouter `.env*.local` au `.gitignore` (déjà couvert par le `.gitignore` Next.js).

## Ordre recommandé

1. `DataAdapter` + `LocalDataAdapter` — aucun changement de comportement, tout reste local.
2. Filtrage par `projectId` et routes `[slug]` — l'application devient réellement multi-projets.
3. Actions asynchrones — l'interface ne bouge pas, seule la plomberie change.
4. `SupabaseDataAdapter` + schéma + RLS.
5. Sortie des binaires vers Storage.
6. Import unique des données locales existantes.

Les étapes 1 à 3 peuvent être faites **sans Supabase** et sécurisent la bascule.
