# Architecture produit — Museion V1

> **Obsolète.** Ce document décrit l'architecture V1 (localStorage, `LocalAuthAdapter`,
> aucun appel réseau). Depuis Sprint 6, Museion tourne sur Supabase (Auth, Postgres, RLS) —
> voir `CLAUDE.md` et `supabase/migrations/` pour l'état réel actuel.

## Vue d'ensemble

Museion est un studio créatif local-first. En V1, toutes les données sont persistées dans localStorage via Zustand persist.

## Couches

```
UI (Next.js App Router + React)
  ↓
Store (Zustand + persist)
  ↓
Adapters (Auth, Data)
  ↓
LocalStorage (V1) / Supabase (V2)
```

## Auth

- `AuthAdapter` : interface abstraite
- `LocalAuthAdapter` : implémentation V1 (profil "administrateur", pas de mot de passe)
- `FutureSupabaseAuthAdapterContract` : contrat à implémenter en V2

## Store Zustand

Store central versionné avec :
- `schemaVersion` : numéro de version pour migrations
- `studioProfile` : profil administrateur
- `projects` : liste de tous les projets
- `auth` : état de connexion
- Migration automatique au démarrage si version < actuelle

## Espaces

| Espace | Statut | Route |
|--------|--------|-------|
| Cinéma | Actif | `/cinema` |
| Publicité | Verrouillé | N/A (badge) |
| Projet personnalisé | Verrouillé | N/A (badge) |

## Navigation Cinéma

```
/cinema                          → Dashboard
/cinema/projects                 → Liste des projets
/cinema/projects/new             → Nouveau projet
/cinema/projects/[slug]          → Workspace projet
/cinema/projects/[slug]/development → Développement
/cinema/projects/[slug]/storyboard  → Sprint 2
/cinema/projects/[slug]/shots       → Sprint 2
/cinema/projects/[slug]/production  → Sprint 2
/cinema/projects/[slug]/review      → Sprint 3
/cinema/projects/[slug]/library     → Sprint 3
/cinema/projects/[slug]/deliverables → Sprint 3
```

---

# Architecture — Sprint 2

## Où vivent les données aujourd'hui

Une seule source : le store Zustand `src/store/museionStore.ts`, persisté par
`zustand/middleware persist` dans **`localStorage`, clé `museion-store-v1`**, `version: 2`.

| Donnée | Champ du store | Persisté |
|---|---|---|
| Projets | `projects` | oui |
| Séquences | `sequences` | oui |
| Scènes | `scenes` (position Canvas incluse) | oui |
| Plans | `shots` | oui |
| Connexions | `edges` | oui |
| Assets (data URI SVG) | `assets` | oui |
| Journal des décisions | `assetJournal` | oui |
| Viewport / sélection | `canvasViewport`, `selectedSceneId`, `selectedShotId` | oui |
| Session | — | `localStorage`, clé **`museion_session`** (`LocalAuthAdapter`) |
| Bases de connaissances | — | non, modules TS statiques |

Poids mesuré du blob avec les données de démonstration : **~96 Ko**, dont **~54 Ko d'assets**
(10 data URI SVG, ~4,9 Ko chacun). C'est le premier poste qui devra sortir de `localStorage`.

Aucune donnée serveur : les 15 routes sont prérendues en statique, aucun appel réseau n'est émis.

## Fournisseurs de prévisualisation

```
PreviewProvider (contrat)
 ├─ MockPreviewProvider              actif   — SVG local déterministe, statut ephemeral
 └─ ComfyUIPreviewProviderContract   inactif — generate() lève, aucune requête réseau
```

`activePreviewProvider` est le seul point d'entrée utilisé par l'interface. Brancher un
fournisseur réel consistera à changer cette constante, pas les vues.

## Une seule source pour les deux vues Storyboard

```
                       museionStore
                 scenes / edges / assets
                    ↑              ↑
        ClassicView (grille)   DynamicCanvas (@xyflow/react)
        @dnd-kit sortable      @dnd-kit droppable sur les nœuds
                    ↓              ↓
                    SceneInspector (partagé)
```

La vue classique et le Canvas ne détiennent aucun état de données propre : ils reçoivent les
mêmes tableaux et appellent les mêmes actions. Le Canvas ne conserve localement que l'état de
rendu de `@xyflow/react`, resynchronisé depuis le store à chaque changement.

## Couplage restant à Gilgamesh

| Élément | État |
|---|---|
| Types et store | génériques, indexés par `projectId` |
| Routes | 9 dossiers `app/cinema/projects/gilgamesh/…` en dur |
| Pages | `projects.find(p => p.slug === 'gilgamesh')` |
| Vues Storyboard / Plans | lisent `scenes` / `shots` **sans filtrer sur `projectId`** |
| `addScene` / `addShot` | repli `'proj-gilgamesh'` si la séquence ou la scène est introuvable |
| Données de démonstration | `demo-storyboard.ts` entièrement Gilgamesh |
| `src/knowledge/camera` et `lighting` | réutilisables pour tout projet |
| `src/knowledge/decors` | spécifique à Gilgamesh |
