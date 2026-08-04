# Modèle de données — Museion V1

## Types principaux

### StudioProfile
Profil du studio local. En V1 : un seul profil "Administrateur".

### Project
Projet cinéma avec toutes ses métadonnées, contenu narratif et état.

### ProjectCanon
Le contenu canonique validé d'un projet (logline finale, synopsis officiel, etc.).

### Decision / Hypothesis / OpenQuestion
Éléments de traçabilité des choix créatifs, toujours distingués visuellement.

### LoglineVersion
Historique des versions d'une logline avec possibilité de restauration.

### Synopsis
Court, long, avec début/développement/résolution.

### Treatment
Structure en 3 actes avec moments clés.

### Script / ScriptScene / ScriptBlock
Structure de scénario avec scènes et blocs (action, dialogue, transition, etc.).

### Character
Fiche personnage complète avec arc, relations, apparence.

### ArtisticDossier
Dossier artistique complet du projet.

### LocalAsset
Référence à un fichier local importé (image, document).

## Projets de démonstration

| Slug | Titre | Statut | Format |
|------|-------|--------|--------|
| `gilgamesh` | Gilgamesh | En développement | Long métrage |
| `akhenaton` | Akhenaton | Pré-production | Long métrage |
| `alexandre` | Alexandre | En développement | Long métrage |
| `civilisation` | Civilisation | Concept | Documentaire |
| `documentaire-projet` | Projet documentaire | Concept | Documentaire |
| `sans-titre` | Projet sans titre | Brouillon | Court métrage |

Gilgamesh est le projet principal avec toutes les sections remplies.

---

# Modèle de données — Sprint 2 (Storyboard, plans, assets)

Défini dans `src/lib/types-storyboard.ts`. **Toutes les entités portent `projectId`** : le modèle
est générique, ce sont les routes et les vues qui restent, pour l'instant, câblées sur Gilgamesh.

## Hiérarchie

```
Project (projectId)
 └─ Sequence         number, title, description, color, order
     └─ StoryboardScene   number, title, location, timeOfDay, moment, emotion,
                          intention, description, lighting, duration, mainShotType,
                          assetId?, order, canvasPosition {x,y}, notes
         └─ Shot          number, type, focal, camera, sensor, ratio, movement,
                          angle, height, filter, duration, frameRate, lighting,
                          decor, continuity, risks, references[], notes,
                          assetId?, order, validated
```

`StoryboardEdge` relie deux scènes (`source` → `target`), de type `sequential` ou `alternative`.
Les connexions sont indépendantes des scènes : en supprimer une ne supprime jamais une scène.

`StoryboardNode` décrit la projection d'une scène sur le Canvas. En pratique la position vit
directement dans `StoryboardScene.canvasPosition` : il n'existe **aucune copie de données par vue**.

## Assets

```
Asset
  status: ephemeral → candidate → approved → canonical
                   ↘ archived
                   ↘ deleted   (terminal)
  url            data URI SVG (composition locale)
  prompt, simulatedModel, sceneId?, sequenceId?
  createdAt, expiresAt?, approvedAt?, approvedBy?
  metadata, versions[], relations[]
```

Règles appliquées par `src/lib/assetLifecycle.ts` :

| Règle | Implémentation |
|---|---|
| `ephemeral` peut devenir `approved` | `ALLOWED_TRANSITIONS.ephemeral` |
| `deleted` ne devient **jamais** `approved` | `ALLOWED_TRANSITIONS.deleted = []` |
| `approved → canonical` seulement sur action humaine | `checkTransition(..., { humanAction: true })` |
| Expiration des `ephemeral` à 14 jours | `EPHEMERAL_TTL_DAYS`, `computeExpiry`, `isExpired` |
| Aucune suppression automatique | `sweepExpired()` signale, ne supprime pas |
| Un asset utilisé dans le storyboard exige une confirmation | `isUsedInStoryboard()` |

Chaque décision humaine est tracée dans `AssetJournalEntry` (`assetJournal` du store) :
action, statut avant/après, auteur, date, note.

## Bases de connaissances

Modules TypeScript statiques, en lecture seule, non persistés.

| Module | Contenu |
|---|---|
| `src/knowledge/camera` | 10 `ShotType`, 13 `CameraMovement`, 6 `CameraKnowledgeEntry`, 8 `LensKnowledgeEntry`, ratios, cadences, angles, hauteurs |
| `src/knowledge/lighting` | 8 `LightingRecipe` + palettes du compositeur SVG |
| `src/knowledge/decors` | 8 `DecorReference` (Gilgamesh) |

`ContinuityRule` est défini dans le modèle mais pas encore alimenté : la continuité est portée
au niveau du plan (`Shot.continuity`) et du décor (`DecorReference.continuity`).

## Données de démonstration Sprint 2

`src/lib/demo-storyboard.ts` — 5 séquences, 22 scènes, 13 plans, 27 connexions
(dont une branche alternative), 10 assets dont 4 temporaires à échéances échelonnées.
