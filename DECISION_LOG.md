# DECISION_LOG.md

## Décisions validées

| # | Date | Décision | Raison |
|---|------|----------|--------|
| D001 | 2026-08-04 | Stack : Next.js 16 + App Router + TypeScript strict | Stabilité, SSR, écosystème |
| D002 | 2026-08-04 | Zustand + persist pour l'état global | Légèreté, API simple, persistance native |
| D003 | 2026-08-04 | LocalAuthAdapter uniquement en V1 | Pas de backend nécessaire pour démarrer |
| D004 | 2026-08-04 | Données démo locales (Gilgamesh, Akhenaton, Alexandre, Civilisation) | Démonstration cohérente sans base de données |
| D005 | 2026-08-04 | Vitest + Testing Library pour les tests unitaires | Compatibilité native Vite, API Jest identique |
| D006 | 2026-08-04 | Tailwind CSS 4 + tailwind-merge + clsx | Cohérence stylistique, composition de classes |
| D007 | 2026-08-04 | Gilgamesh = projet principal actif en Sprint 1 | Démo fonctionnelle complète |
| D008 | 2026-08-04 | Un seul store Zustand pour les deux vues Storyboard | Interdit toute copie de données par vue ; la vue classique et le Canvas lisent `scenes`, `edges`, `assets` au même endroit |
| D009 | 2026-08-04 | `schemaVersion` porté à 2 avec migration v1 → v2 | Le storyboard partagé est ajouté sans casser les données Sprint 1 déjà persistées |
| D010 | 2026-08-04 | `MockPreviewProvider` seul fournisseur actif | Aucune IA, aucun réseau, aucune clé ; le rendu est un SVG local déterministe étiqueté « Simulation locale — aucune IA appelée » |
| D011 | 2026-08-04 | `ComfyUIPreviewProviderContract` inactif, `generate()` lève | Fige l'interface pour plus tard sans autoriser le moindre appel réseau |
| D012 | 2026-08-04 | Composition de prompts strictement déterministe | Le prompt est une projection des paramètres validés, jamais une génération ; aucun LLM |
| D013 | 2026-08-04 | `deleted` est un état terminal | Un asset supprimé ne peut plus jamais devenir `approved` ; `ALLOWED_TRANSITIONS.deleted` est vide |
| D014 | 2026-08-04 | `approved → canonical` exige `humanAction: true` | La primauté humaine est encodée dans la règle, pas seulement dans l'UI |
| D015 | 2026-08-04 | Aucune suppression automatique d'asset expiré | `sweepExpired()` signale ; il ne supprime pas. Un asset rattaché à une scène demande une confirmation explicite |
| D016 | 2026-08-04 | Supprimer une connexion ne supprime jamais les scènes | `removeEdge` ne touche qu'à `edges` ; la touche Suppr. est désactivée sur le Canvas (`deleteKeyCode={null}`) |
| D017 | 2026-08-04 | Route `/shots` remplacée par `/plans` | Le libellé produit est « Plans & caméra » ; `/shots` redirige pour ne casser aucun lien existant |
| D018 | 2026-08-04 | Vignettes en SVG local via `background-image` | Pas de `<img>`, pas de fichier binaire, rendu déterministe et reproductible hors ligne |
| D019 | 2026-08-04 | Bases de connaissances en modules TypeScript statiques | Lecture seule, versionnées avec le code, extensibles sans base de données |
| D020 | 2026-08-04 | Les fiches caméra portent un avertissement permanent | « Une simulation esthétique ne prouve jamais l'usage réel d'une caméra » — affiché dans l'inspecteur et le compositeur de prompt |

## Hypothèses

| # | Hypothèse | À valider |
|---|-----------|-----------|
| H001 | Supabase sera utilisé pour la gestion des comptes en V2 | **Confirmé** — plan de bascule décrit dans `docs/SUPABASE_MIGRATION.md` |
| H002 | Le workflow Publicité sera similaire au workflow Cinéma | À définir |
| H003 | Les projets personnalisés auront un système de modules | À concevoir |
| H004 | Une route `[slug]` unique remplacera les dossiers `gilgamesh/` sans réécrire les vues | À valider au Sprint 3 : les vues ne dépendent que de `projectId` |
| H005 | 14 jours suffisent comme durée de vie d'une prévisualisation temporaire | À confirmer à l'usage réel |

## Questions ouvertes

| # | Question | Priorité |
|---|----------|----------|
| Q001 | Quel format de fichier pour les exports finaux ? | Sprint 2 |
| Q002 | Système de collaboration multi-utilisateurs ? | V2 |
| Q003 | Intégration d'outils IA génératifs en production ? | V2 |
| Q004 | Où stocker les assets locaux (images de référence) ? | **Sprint 2 — réponse partielle** : data URI SVG dans le store local ; les vrais binaires iront dans Supabase Storage (voir `docs/SUPABASE_MIGRATION.md`) |
| Q005 | Faut-il filtrer les scènes et plans par `projectId` dès l'affichage ? | Sprint 3 — obligatoire avant tout second projet |
| Q006 | Les positions du Canvas doivent-elles être par utilisateur ou par projet ? | V2 multi-utilisateurs |
| Q007 | Quelle politique de purge pour les assets `deleted` ? | Sprint 3 |
