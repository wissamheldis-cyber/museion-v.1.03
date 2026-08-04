# UI Reference Audit — Museion Sprint 1

## Logo (Musion logo.png)

- **Page représentée :** Splash / identité de marque
- **Description :** Cheval en silhouette noire galopant à travers des colonnes de film, typographie "MUSEION" en majuscules espacées, style cinématographique noir et blanc
- **Couleurs :** Noir pur (#000), blanc (#fff), gris moyen pour le halo de lumière
- **Typographie :** Sans-serif large tracking, majuscules
- **Usage :** Logo dans la sidebar, page de login, favicon
- **À reproduire :** Fichier copié dans `public/brand/museion-logo.png`
- **Illustratif :** Le cheval et le film strip (identité visuelle, pas éléments UI)

---

## 01 — Dashboard Cinéma (02_50_55 (1))

- **Page représentée :** `/cinema` — Tableau de bord de l'espace Cinéma
- **Organisation générale :** Sidebar gauche fixe (~220px) + header projet + contenu principal en colonnes
- **Navigation :** Sidebar avec sections : Tableau de bord, Projets, Développement, Storyboard, Plans, Production, Review, Bibliothèque, Livrables. Logo Museion en haut. Profil en bas.
- **Hiérarchie :**
  1. Titre "Projets cinéma" + bouton "Nouveau projet cinéma"
  2. Section "Reprendre le travail" (3 cartes projet avec image, titre, statut, progression)
  3. Section "Validations en attente" (liste)
  4. Section "Productions récentes" + "Activité du studio"
- **Densité :** Modérée — respirations généreuses, cartes bien espacées
- **Composants :** Sidebar nav, project cards (image + titre + barre de progression), badges statut, liste de validations, activity feed
- **Couleurs :** Fond #0a0c10, cards #141720, sidebar #0f1219 avec backdrop-blur, bleu #3b8ef0 pour actions, texte blanc cassé #e8e8e6
- **Typographie :** Titre ~24px bold, section headings ~14px medium uppercase, texte body ~13px
- **Interactions :** Cartes cliquables → workspace projet, bouton "Nouveau projet cinéma"
- **À reproduire :** Structure sidebar + header + 3 sections
- **Illustratif :** Images de films (Gilgamesh, Akhenaton, Alexandre)

---

## 02 — Liste des projets (02_50_55 (2))

- **Page représentée :** `/cinema/projects` — Tous les projets cinéma
- **Organisation :** Même sidebar + header "Tous les projets cinéma" + barre de recherche/filtres + liste + panneau latéral droit (Collections, Favoris, Archives)
- **Navigation :** Onglet "Projets" actif dans la sidebar
- **Hiérarchie :**
  1. Titre + sous-titre
  2. Barre recherche + filtres (Format, Genre)
  3. Liste de projets (image miniature + titre + logline + statut + format + progression)
  4. Panneau droit : Collections / Favoris / Archives
- **Densité :** Moyenne — lignes de projet bien séparées
- **Composants :** Barre de recherche, dropdowns filtres, liste de projets (row item), badges statut, panneau collections
- **Couleurs :** Identique dashboard
- **Interactions :** Recherche live, filtres, clic sur Gilgamesh → workspace
- **À reproduire :** Layout list + filtres + panneau droit
- **Illustratif :** Images de films dans les miniatures

---

## 03 — Nouveau projet (02_50_55 (3))

- **Page représentée :** `/cinema/projects/new`
- **Organisation :** Sidebar + formulaire multi-étapes (4 steps) + panneau "Blueprint initial" à droite
- **Navigation :** Steps linéaires : 1. Intention → 2. Format → 3. Références → 4. Validation
- **Hiérarchie :**
  1. Stepper horizontal en haut
  2. Formulaire principal (titre, type, logline, ambition visuelle, durée, genre, univers)
  3. Panneau Blueprint à droite (mis à jour en temps réel)
  4. Boutons "Enregistrer un brouillon" / "Créer le projet"
- **Densité :** Aérée
- **Composants :** Stepper, inputs text, dropdown type, radio format, textarea logline, upload références
- **Couleurs :** Identique
- **Interactions :** Stepper cliquable, Blueprint se met à jour live, validation avant création
- **À reproduire :** Layout 2 colonnes (formulaire + blueprint), stepper
- **Illustratif :** Images de références locales

---

## 04 — Développement Gilgamesh (02_50_55 (4))

- **Page représentée :** `/cinema/projects/gilgamesh/development`
- **Organisation :** Sidebar projet + header Gilgamesh avec onglets + contenu + panneau "Carnet du projet" à droite
- **Navigation :** Onglets : Vision, Logline, Traitement, Dossier artistique (+ Synopsis, Scénario, Personnages implicites)
- **Hiérarchie :**
  1. Breadcrumb : Projets > Gilgamesh > Développement
  2. Titre "Gilgamesh — Développement" + actions (Résumer, Proposer 3 variantes, Valider)
  3. Onglets de développement
  4. Contenu en cartes (Promesse, Intention, Thème, Monde, Conflit, Arc, Ton, Références)
  5. Panneau droit : Long métrage, Genre, Questions ouvertes
- **Densité :** Moyenne-haute — beaucoup de contenu structuré en cartes
- **Composants :** Breadcrumb, tabs, cards éditables, badges (décision/hypothèse/question), panneau contextuel
- **Couleurs :** Identique + badges colorés pour statuts (vert = validé, ambre = hypothèse, bleu = question)
- **Typographie :** Labels ~12px uppercase, valeurs ~14px, titre carte ~13px semibold
- **Interactions :** Onglets, édition inline, sauvegarde, distinction visuelles des statuts
- **À reproduire :** Layout onglets + cartes + panneau droit
- **Illustratif :** Images de références cinéma dans les cartes

---

## 05 — Storyboard (02_50_55 (5)) — reproduit au Sprint 2

- **Page représentée :** `/cinema/projects/gilgamesh/storyboard`
- **Organisation :** Sidebar + header (breadcrumb, titre, sous-titre, actions à droite) + bande de séquences + grille de scènes + panneau « Scène sélectionnée »
- **Hiérarchie :**
  1. Breadcrumb « Projets cinéma / Gilgamesh »
  2. Titre « Storyboard » + « Organisez vos séquences et visualisez vos scènes clés. »
  3. Bande horizontale des 5 séquences (miniature, numéro, titre, nombre de scènes)
  4. Grille de cartes scène (miniature, numéro, menu, titre, durée, intention)
  5. « Ajouter une scène » en zone pointillée
  6. Panneau droit : miniature, titre, durée estimée, description, émotion, lieu, moment, actions
- **Composants :** onglets de vue, filtres, cartes scène, inspecteur, boutons d'action
- **Écarts assumés :**
  - Les deux boutons de bascule d'affichage de la référence sont devenus **deux onglets nommés** (« Storyboard classique » / « Tableau dynamique »), demandés par le Sprint 2
  - « Générer variantes » est devenu **« Générer une prévisualisation »** : le libellé doit dire ce que fait réellement le bouton (composition SVG locale, aucune IA)
  - Ajout d'un champ « Moment » distinct de INT/EXT, nécessaire au découpage
- **Illustratif :** Les images de storyboard de la référence sont des dessins ; l'application affiche des compositions SVG locales déterministes, jamais présentées comme des images de production

---

## 06 — Plans & caméra (02_50_55 (6)) — reproduit au Sprint 2

- **Page représentée :** `/cinema/projects/gilgamesh/plans`
- **Organisation :** Sidebar + header + barre de filtres + grille de cartes plan + panneau « Plan sélectionné »
- **Hiérarchie :**
  1. Titre « Plans & caméra » + « Affinez chaque plan avant la production. »
  2. Filtres : Séquence, Intérieur / Extérieur, Caméra, Validé + recherche
  3. Cartes plan : numéro, badge séquence, pastille de validation, miniature, tableau (type, focale, mouvement, durée, lumière, décor, continuité), menu
  4. « Ajouter un plan » en zone pointillée
  5. Panneau droit : numéro, badge « Validé », séquence et type, miniature, « Réglages caméra », « Notes de réalisation », actions
- **Écarts assumés :**
  - « Créer prompt image » est devenu **« Prévisualisation du prompt »** : la fonction produit un prompt image **et** un prompt vidéo, sans LLM
  - « Envoyer en production » est explicitement étiqueté **(Sprint 3)** et pointe vers la page en construction, plutôt que de simuler une fonction inexistante
  - Ajout d'une fiche technique caméra dépliable (usages, limites) issue de `src/knowledge/camera`, avec l'avertissement permanent sur la valeur des simulations
- **Illustratif :** Les images photoréalistes de la référence ; l'application ne prétend jamais qu'une image simulée prouve l'usage réel d'une caméra

---

## Écrans Sprint 3 (visuels de référence avancée)

- **Production visuelle** (02_50_55 (7)) : File de génération image/vidéo, job details
- **Review & validations** (02_50_55 (8)) : Comparaison A/B, commentaires, checklist
- **Bibliothèque** (02_50_55 (9)) : Grille d'assets avec filtres et panneau sélection

---

## Références générales (images juillet 2026)

- **UI style** : Dark mode premium, sidebar Liquid Glass, cards légèrement translucides
- **Palette confirmée** : #0a0c10 fond, #141720 cards, #1c2030 hover, #3b8ef0 bleu accent
- **Typographie** : Inter ou système sans-serif, tailles 12/13/14/16/24px
- **Bords** : radius 8-12px (cards), 6px (inputs)
- **Transitions** : 150ms ease-in-out
