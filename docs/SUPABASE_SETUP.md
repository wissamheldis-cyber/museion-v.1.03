# Supabase — installation et opérations (Sprint 6)

Projet distant de développement : `qwqyrkifzcpbtzfdctsl` (déjà lié).

## Installation

```bash
npm install            # installe aussi la CLI Supabase (devDependency)
npx supabase --version
```

## Variables d'environnement

- `.env.local` (ignoré par Git) contient `NEXT_PUBLIC_SUPABASE_URL` et
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` du projet distant. Ne jamais y
  ajouter de clé secrète ou de `service_role`.
- `.env.example` documente les clés attendues, sans valeurs.
- Pour travailler contre la stack locale au lieu du projet distant, créer un
  `.env.development.local` (ignoré par Git) avec l'URL et la clé publiées par
  `npx supabase status` — ne jamais copier ces valeurs dans `.env.local`.

## Démarrage local

```bash
npx supabase start     # nécessite Docker Desktop démarré
npx supabase status    # affiche les URLs et clés locales
npx supabase db reset  # reconstruit la base locale à partir des migrations + seed
npx supabase stop
```

Le service `edge_runtime` est désactivé dans `supabase/config.toml` (aucune
fonction Edge utilisée en Sprint 6) — c'était la cause d'un blocage du
premier `supabase start` sur cette machine.

## Liaison au projet distant

Déjà fait pour ce dépôt (`npx supabase link --project-ref qwqyrkifzcpbtzfdctsl`).
`npx supabase login` nécessite un vrai terminal interactif (le bridge `!` de
Claude Code est non-TTY) : ouvrir PowerShell/CMD directement pour relancer si
besoin.

## Migrations

Toutes dans `supabase/migrations/`, appliquées dans l'ordre du nom de fichier :

| Fichier | Contenu |
|---|---|
| `070000_extensions_and_helpers` | pgcrypto, trigger générique `version`/`updated_at` |
| `070001_core_identity` | `profiles`, `studios`, `studio_members`, fonctions RLS, protection du dernier owner |
| `070002_projects` | `projects`, `project_canon`, `project_context_snapshots`, `decisions`, `hypotheses`, `open_questions` |
| `070003_conversation_and_writing` | `conversations`, `messages`, `writing_missions`, `ai_proposals`, `skill_definitions`, `skill_runs`, `provider_connection_metadata`, `usage_events` |
| `070004_production` | `generation_jobs`, `assets` (+ trigger de cycle de vie), `asset_versions`, `asset_relations` |
| `070005_review_and_deliverables` | `reviews`, `review_comments`, `deliverables`, `audit_events` |
| `070006_rls_policies` | RLS + RPC `create_studio` |
| `070007_storage_buckets` | buckets privés + policies |
| `070008_service_role_grants` | GRANTs manquants pour `service_role` |
| `070009_creative_writing_fields` | `logline_versions`, `characters`, `script_scenes`, colonnes `treatment`/`vision`/`artistic_dossier`/`workflow` sur `project_canon` |
| `070010_storyboard` | `sequences`, `storyboard_scenes`, `shots`, `storyboard_edges`, `asset_journal_entries`, `continuity_rules` |
| `070011_sprint4_extensions` | rattache `messages` à `writing_missions`, `review_checklist_items`, `asset_collections` |
| `070012_extended_rls` | RLS pour les tables ci-dessus |

```bash
npx supabase migration list       # compare local / distant
npx supabase db push --dry-run    # aperçu — n'applique rien
npx supabase db push              # applique pour de vrai — validation humaine requise avant
```

Ne jamais exécuter `npx supabase db reset --linked`.

## Création des comptes

L'inscription publique est désactivée. Les comptes s'ouvrent par
l'API admin :

```powershell
$env:SUPABASE_URL = "https://qwqyrkifzcpbtzfdctsl.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<coller uniquement dans ce shell>"
node scripts/supabase/create-dev-users.mjs
Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
```

Envoie une invitation email (pas de mot de passe généré côté script) aux
trois comptes prévus. `supabase/seed.sql` relie ensuite chaque email à son
studio (Museion / Jim Filmmaker / GRIFZ) une fois le compte confirmé.

## Tests RLS

```bash
npx supabase start
node scripts/supabase/test-rls.mjs
```

17 assertions réelles (positives et négatives) contre la stack locale :
isolation inter-studio, rôles (owner/admin/creator/reviewer), protection du
dernier owner, buckets privés. Crée puis supprime ses propres comptes/studios
de test — n'affecte jamais les données seedées.

## Import des données locales

Le Sprint 6 a converti le store applicatif entier (`museionStore.ts`) pour
lire/écrire directement Supabase dès qu'une session existe — il n'y a donc
plus de blob local séparé à migrer via un assistant dédié. Un studio flambant
neuf (aucun projet) est automatiquement peuplé avec les projets de démo
(Gilgamesh compris) au premier chargement (`bootstrapDemoData`, dans
`src/adapters/supabase/workspace.ts`). Les anciennes données `localStorage`
(clé `museion-v2-data`, écrite par l'ancien `LocalDataAdapter`) restent en
place sur le poste de l'utilisateur mais ne sont plus lues par l'application.

## Commandes interdites / destructives

- `npx supabase db reset --linked`
- `npx supabase db push` sans dry-run préalable ni validation humaine
- Toute copie de `SECRET_KEY` / `service_role` / mot de passe Postgres dans
  un fichier versionné, un test, une capture d'écran ou une réponse de chat
