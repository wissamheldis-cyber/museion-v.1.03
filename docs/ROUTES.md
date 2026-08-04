# Routes — Museion V1

| Route | Page | Auth requise | Sprint |
|-------|------|-------------|--------|
| `/login` | Page de connexion | Non | 1 |
| `/` | Accueil — choix de l'espace | Oui | 1 |
| `/cinema` | Dashboard Cinéma | Oui | 1 |
| `/cinema/projects` | Liste des projets | Oui | 1 |
| `/cinema/projects/new` | Nouveau projet | Oui | 1 |
| `/cinema/projects/gilgamesh` | Workspace Gilgamesh | Oui | 1 |
| `/cinema/projects/gilgamesh/development` | Développement | Oui | 1 |
| `/cinema/projects/gilgamesh/storyboard` | Storyboard — classique + tableau dynamique | Oui | 2 (actif) |
| `/cinema/projects/gilgamesh/plans` | Plans & caméra | Oui | 2 (actif) |
| `/cinema/projects/gilgamesh/shots` | Redirection vers `/plans` | Oui | 2 |
| `/cinema/projects/gilgamesh/production` | Production | Oui | 3 |
| `/cinema/projects/gilgamesh/review` | Review | Oui | 3 |
| `/cinema/projects/gilgamesh/library` | Bibliothèque | Oui | 3 |
| `/cinema/projects/gilgamesh/deliverables` | Livrables | Oui | 3 |

## Note Sprint 2

Les routes restent des dossiers statiques `gilgamesh/`. Le passage à un segment `[slug]`
est décrit dans `docs/SUPABASE_MIGRATION.md` (étape 4) : les vues ne dépendent que de
`projectId`, seule la source du slug change.
