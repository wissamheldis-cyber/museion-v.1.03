# CLAUDE.md — Instructions permanentes pour Museion

## Nom du produit
Le nom canonique est **Museion**. Ne jamais écrire Museon, Musion, SHOU Control Plane, ou utiliser "Jim Filmmaker Studio" comme nom de produit.

## Principes fondamentaux
- L'humain a la primauté sur toute automatisation
- Décisions, hypothèses et questions ouvertes sont toujours séparées et tracées
- Aucune API réelle n'est appelée sans autorisation explicite
- Aucune clé secrète ne doit figurer dans le dépôt

## Espaces actifs / verrouillés
- **Cinéma** : actif et fonctionnel
- **Publicité** : visible mais verrouillé (badge "Bientôt disponible")
- **Projet personnalisé** : visible mais verrouillé

## Références UI
- Les images dans `/references` sont la source visuelle principale
- Toujours consulter `docs/UI_REFERENCE_AUDIT.md` avant de modifier une interface
- Ne jamais remplacer les références par un dashboard SaaS générique

## Direction artistique

Source de vérité : `references/ref.png`, `ref2.png`, `ref3.png`, `ref4.png`.
Ces quatre images remplacent la direction artistique bleutée d'origine.

- **Monochrome.** Le chrome de l'interface est blanc, gris et noir. Aucune couleur d'accent
  décorative.
- **La couleur est réservée à la donnée**, jamais à la décoration : vert pour un état validé
  ou « On Track », champagne pour un état temporaire ou un avertissement, rouge pour le
  destructif, et les couleurs fonctionnelles d'un outil (frustums caméra, tracés).
- Fond noir neutre et profond, sans dominante bleue (#08090b, #0d0e11, #111216)
- Blanc cassé pour les textes (#ececea), gris pour le secondaire (#8e9099), gris sourd pour
  le tertiaire (#5a5c66)
- **Actions principales : fond sombre + bordure claire**, jamais un aplat de couleur
- **Panneaux plats et opaques**, séparés par des filets de 1 px à 5–9 % de blanc.
  Pas de dégradés de fond entre zones voisines.
- **Le flou est réservé aux surcouches** (modales, tiroirs). La navigation n'est pas en verre.
- Typographie : labels de section en capitales très espacées (0.14em), chiffres clés en
  grande taille et graisse légère, chiffres tabulaires
- Wordmark MUSEION en typographie espacée, pas en image
- Densité d'outil professionnel : dense et lisible, jamais tassé
- L'image est le héros : vignettes larges, traitées en valeurs sombres
- Transitions 120–220ms
- prefers-reduced-motion respecté
- Contraste accessible (WCAG AA minimum)

## Ce qu'il ne faut pas faire
- Réintroduire une couleur d'accent dans le chrome (le bleu #3b8ef0 est retiré)
- Recouvrir les composants de verre
- Utiliser des néons gratuits
- Rendre les textes minuscules
- Créer une interface surchargée
- Inventer une direction artistique en dehors de `references/ref1-4`
- Cyberpunk / glow excessif
- Dashboard SaaS générique
- Pages placeholder (afficher "En construction dans le prochain sprint" proprement)
- Déclarer une fonction opérationnelle sans test réel
- Simuler une fonction absente : une capacité non construite s'affiche comme non construite

## Architecture
- L'interface doit être plus simple que l'architecture sous-jacente
- Toutes les pages partagent le même store Zustand
- Persistance locale uniquement en V1 (LocalAuthAdapter)
- Supabase prévu mais non installé

## Profil utilisateur V1
- Seul profil accepté : `administrateur` (affiché "Administrateur")
- Aucun mot de passe en V1
