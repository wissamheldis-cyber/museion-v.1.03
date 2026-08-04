# STATUS.md — Sprint 2

**Date :** 2026-08-04
**Sprint :** 2 / 3
**Statut global :** COMPLET

## Commandes validées

| Commande | Résultat |
|----------|----------|
| `npm run lint` | OK — 0 erreur, 0 warning |
| `npm test` | OK — 78 tests, 5 fichiers |
| `npm run build` | OK — 15 routes compilées, TypeScript strict |
| `npm run dev` | OK — port 3000 |

## Vérification réelle dans le navigateur

Parcours exécuté sur `http://localhost:3000` (Chromium 1440×900), **0 erreur console**.

| Vérification | Résultat observé |
|---|---|
| Connexion profil administrateur | OK |
| 5 séquences + 8 scènes en vue classique | OK |
| Sélection de scène | OK |
| Édition inline (lieu, émotion, durée…) | OK, persistée |
| Générer une prévisualisation | OK — 10 → 11 assets, `museion-mock-compositor-v1`, statut `ephemeral`, échéance 14 j |
| Dupliquer une scène | OK |
| Changer de séquence | OK |
| Réorganiser par glisser-déposer | OK — `1,2,3,4…` → `2,3,4,1…` |
| Supprimer une scène (confirmation) | OK |
| Canvas rendu | OK — 22 nœuds, 22 connexions |
| Bac d'assets | OK |
| Créer une connexion | OK — 22 → 23 |
| Déplacer un nœud + persistance | OK — `{80,80}` → `{232,217}` |
| Supprimer une connexion | OK — 23 → 22 connexions, **22 scènes conservées** |
| Glisser un asset sur une scène | OK |
| Réinitialiser la disposition | OK — 22 scènes replacées sur la grille |
| Restaurer et valider (archives) | OK — 4 → 3 temporaires, décision journalisée |
| Confirmation avant suppression d'un asset utilisé | OK |
| Asset supprimé → statut terminal | OK |
| Plans & caméra — 13 plans | OK |
| Filtre caméra | OK — 2 plans Sony VENICE 2 |
| Recherche plein texte | OK |
| Édition des réglages caméra | OK |
| Fiche technique caméra (usages / limites) | OK |
| Prompt image + prompt vidéo distincts | OK |
| Contrat ComfyUI affiché et annoncé inactif | OK |
| Valider / ajouter / dupliquer / supprimer un plan | OK |
| Vue tableau | OK |
| État conservé après rechargement | OK — `schemaVersion 2` |

Responsive vérifié à **1440 / 1280 / 1024 px** : aucun débordement horizontal, bac d'assets et
inspecteur repliés automatiquement sous 1280 px.

> Note : un plantage isolé de l'onglet Chromium headless est survenu une fois pendant le
> glisser-déposer, non reproductible sur 5 exécutions ultérieures du même parcours. Aucune
> erreur applicative associée.

## Routes

| Route | Statut | Fonctionnel |
|-------|--------|-------------|
| `/login` | Actif | Auth locale administrateur |
| `/` | Actif | Cinéma actif, Publicité et Projet personnalisé verrouillés |
| `/cinema` | Actif | Dashboard |
| `/cinema/projects` | Actif | Liste + recherche + filtres |
| `/cinema/projects/new` | Actif | Formulaire multi-étapes |
| `/cinema/projects/gilgamesh` | Actif | Workspace |
| `/cinema/projects/gilgamesh/development` | Actif | 7 onglets |
| `/cinema/projects/gilgamesh/storyboard` | **Actif (Sprint 2)** | Vue classique + tableau dynamique |
| `/cinema/projects/gilgamesh/plans` | **Actif (Sprint 2)** | Plans & caméra, inspecteur, prompts |
| `/cinema/projects/gilgamesh/shots` | Redirection | → `/plans` |
| `/cinema/projects/gilgamesh/production` | Sprint 3 | Placeholder propre |
| `/cinema/projects/gilgamesh/review` | Sprint 3 | Placeholder propre |
| `/cinema/projects/gilgamesh/library` | Sprint 3 | Placeholder propre |
| `/cinema/projects/gilgamesh/deliverables` | Sprint 3 | Placeholder propre |

## Tests

| Fichier | Tests | Couverture |
|---------|-------|------------|
| `auth.test.ts` | 8 | LocalAuthAdapter |
| `utils.test.ts` | 14 | countWords, slugify, cn, demo-data |
| `storyboard.test.tsx` | 20 | Store partagé entre les deux vues, scènes, connexions, positions, plans |
| `assets.test.ts` | 17 | Cycle de vie, expiration 14 j, restauration, MockPreviewProvider |
| `knowledge.test.ts` | 19 | Bases caméra / lumière / décors, composition de prompts, contrat ComfyUI |

## Livrables Sprint 2

### Modèle
- `src/lib/types-storyboard.ts` — Sequence, StoryboardScene, Shot, StoryboardNode, StoryboardEdge,
  Asset, AssetVersion, AssetRelation, AssetJournalEntry, CameraKnowledgeEntry, LensKnowledgeEntry,
  ShotType, CameraMovement, LightingRecipe, DecorReference, ContinuityRule
- `src/lib/assetLifecycle.ts` — règles pures du cycle de vie
- `src/lib/promptComposer.ts` — composition déterministe, sans LLM
- `src/lib/demo-storyboard.ts` — 5 séquences, 22 scènes, 13 plans, 27 connexions, 10 assets

### Bases de connaissances
- `src/knowledge/camera/` — 10 types de plans, 13 mouvements, 6 caméras, 8 optiques, ratios,
  cadences, angles, hauteurs
- `src/knowledge/lighting/` — 8 recettes + palettes du compositeur local
- `src/knowledge/decors/` — 8 décors Gilgamesh (identité, architecture, matériaux, palette,
  époque, géographie, accessoires, lumière, continuité, références)

### Prévisualisation
- `src/providers/preview/PreviewProvider.ts` — contrat
- `src/providers/preview/MockPreviewProvider.ts` — **actif**, SVG local déterministe
- `src/providers/preview/ComfyUIPreviewProviderContract.ts` — **inactif**, aucune requête réseau
- `src/providers/preview/mockSvg.ts` — compositeur SVG

### Interface
- `src/components/storyboard/` — ClassicView, SceneCard, SequenceStrip, SceneInspector,
  DynamicCanvas, SceneNode, AssetBin, TemporaryArchives
- `src/components/plans/` — ShotCard, ShotInspector, PromptComposer
- `src/components/ui/` — PreviewFrame, ConfirmDialog

### Captures
`docs/screenshots/sprint-2/` — 21 captures (1440 / 1280 / 1024 px)

## Limites connues

- Routes toujours codées en dur pour `gilgamesh` (pas de segment `[slug]`)
- Les vues Storyboard et Plans ne filtrent pas encore sur `projectId`
- Les autres projets de démonstration n'ont ni storyboard ni plans
- Aucun upload d'image réel : les vignettes sont des compositions SVG locales
- Aucune IA appelée, aucun réseau : `MockPreviewProvider` uniquement
- Production, Review, Bibliothèque, Livrables = Sprint 3
- E2E Playwright non intégré au dépôt (vérification scriptée hors dépôt)

## Sprint 1 — rappel

Le détail du Sprint 1 (14 routes, 22 tests, auth locale, développement en 7 onglets) est
conservé dans l'historique Git. Toutes ses fonctionnalités restent actives.
