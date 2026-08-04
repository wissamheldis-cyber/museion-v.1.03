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
- Dark mode premium : fond noir profond et bleu-noir (#0a0c10, #0d0f14)
- Blanc cassé pour les textes (#e8e8e6)
- Gris froid pour les textes secondaires (#8a8f9e)
- Bleu froid pour les actions principales (#3b8ef0)
- Accent champagne discret (#c9a84c)
- Navigation de premier niveau en Liquid Glass (backdrop-blur + transparence)
- Zones d'écriture opaques et lisibles
- Transitions 120–220ms
- prefers-reduced-motion respecté
- Contraste accessible (WCAG AA minimum)

## Ce qu'il ne faut pas faire
- Recouvrir tous les composants de verre
- Utiliser des néons gratuits
- Rendre les textes minuscules
- Créer une interface surchargée
- Inventer une nouvelle direction artistique
- Cyberpunk / glow excessif
- Dashboard SaaS générique
- Pages placeholder (afficher "En construction dans le prochain sprint" proprement)
- Déclarer une fonction opérationnelle sans test réel

## Architecture
- L'interface doit être plus simple que l'architecture sous-jacente
- Toutes les pages partagent le même store Zustand
- Persistance locale uniquement en V1 (LocalAuthAdapter)
- Supabase prévu mais non installé

## Profil utilisateur V1
- Seul profil accepté : `administrateur` (affiché "Administrateur")
- Aucun mot de passe en V1
