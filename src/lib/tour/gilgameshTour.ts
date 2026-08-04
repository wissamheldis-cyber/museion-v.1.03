// ============================================================
// MUSEION — Parcours guidé Gilgamesh
// Chaque étape décrit ce qui existe réellement, et nomme ce qui
// n'existe pas encore. Aucune fonction n'est simulée.
// ============================================================

import type { DemoTour } from './types'

const base = (slug: string) => `/cinema/projects/${slug}`

export const GILGAMESH_TOUR: DemoTour = {
  id: 'gilgamesh-v1',
  label: 'Démonstration guidée de Museion',
  description: 'Le trajet complet d’un projet, de l’idée jusqu’aux livrables.',
  steps: [
    {
      id: 'overview',
      route: base,
      target: '[data-tour="project-overview"]',
      title: 'Vue d’ensemble',
      explanation:
        'Voici le poste de pilotage du projet : sa progression, ses grandes phases, et la navigation latérale qui suit l’ordre réel du travail.',
      rationale:
        'Un film se perd quand personne ne sait à quelle étape il en est. Museion rend cet état lisible en permanence.',
      action: 'Parcourez le menu latéral : il suit la chaîne idée → scénario → storyboard → plans → production.',
      animation: 'fade',
    },
    {
      id: 'workflow',
      route: base,
      target: '[data-tour="workflow"]',
      title: 'Les phases du projet',
      explanation:
        'Dix étapes, de l’idée à la livraison. Chacune porte un état : à faire, en cours, terminé.',
      rationale:
        'La progression affichée n’est pas déclarative : elle est déduite de l’état réel des étapes.',
      animation: 'count',
    },
    {
      id: 'development',
      route: (slug) => `${base(slug)}/development`,
      target: '[data-tour="development-tabs"]',
      title: 'Développement',
      explanation:
        'Vision, logline, synopsis, traitement, scénario, personnages et dossier artistique. Chaque onglet est une couche du récit.',
      rationale:
        'Ce qui est validé ici devient le canon du projet : la référence que le storyboard et les plans ne contrediront pas.',
      action: 'Ouvrez un onglet : le contenu est éditable et sauvegardé localement à chaque frappe.',
      reveal: 'Vision, logline et traitement de Gilgamesh sont déjà remplis.',
      animation: 'rise',
    },
    {
      id: 'traces',
      route: (slug) => `${base(slug)}/development`,
      target: '[data-tour="project-notebook"]',
      title: 'Décisions, hypothèses, questions',
      explanation:
        'Trois statuts distincts, jamais mélangés : ce qui est décidé, ce qui reste à confirmer, ce qui reste ouvert.',
      rationale:
        'Séparer une décision d’une hypothèse évite qu’une supposition devienne une contrainte de tournage par inadvertance.',
      animation: 'fade',
    },
    {
      id: 'writing',
      route: (slug) => `${base(slug)}/writing-assistant`,
      title: 'Assistance à l’écriture',
      explanation:
        'Cette section accueillera les beats par acte, la santé de structure et les objectifs par personnage.',
      rationale:
        'L’assistance visera à révéler les trous de structure, pas à écrire à votre place.',
      action:
        'Aucun modèle de langage n’est branché aujourd’hui : la page annonce ce qu’elle fera, sans le simuler.',
      animation: 'fade',
    },
    {
      id: 'storyboard',
      route: (slug) => `${base(slug)}/storyboard`,
      target: '[data-tour="sequence-strip"]',
      title: 'Storyboard — séquences et scènes',
      explanation:
        'Cinq séquences, vingt-deux scènes. Chaque carte porte une miniature, une intention, une durée, un lieu et un moment.',
      rationale:
        'Le storyboard est le premier endroit où le récit devient une durée et un espace mesurables.',
      action: 'Cliquez une scène : l’inspecteur de droite s’ouvre et devient éditable.',
      animation: 'rise',
    },
    {
      id: 'scene-inspector',
      route: (slug) => `${base(slug)}/storyboard`,
      target: '[aria-label="Inspecteur de scène"]',
      title: 'De la description à la prévisualisation',
      explanation:
        'Une scène part d’une description, reçoit un cadrage, puis une prévisualisation, et enfin une validation humaine.',
      rationale:
        'La prévisualisation reste temporaire tant qu’un humain ne l’a pas validée : elle expire au bout de 14 jours.',
      action:
        '« Générer une prévisualisation » compose une image localement, en SVG. Aucune IA n’est appelée.',
      animation: 'draw',
    },
    {
      id: 'board',
      route: (slug) => `${base(slug)}/board`,
      target: '[data-tour="canvas"]',
      title: 'Tableau dynamique',
      explanation:
        'Les mêmes scènes, vues comme un graphe : des nœuds, des connexions séquentielles, et des branches alternatives en pointillés.',
      rationale:
        'Déplacer une scène ici ne la duplique pas : les deux vues lisent exactement les mêmes données.',
      action:
        'Glissez un nœud, tirez une connexion depuis un point de liaison. Supprimer une connexion ne supprime jamais une scène.',
      animation: 'draw',
    },
    {
      id: 'plans',
      route: (slug) => `${base(slug)}/plans`,
      target: '[data-tour="shot-grid"]',
      title: 'Plans & caméra',
      explanation:
        'Type de plan, focale, caméra, capteur, ratio, mouvement, angle, hauteur, filtre, durée, cadence, lumière, décor et continuité.',
      rationale:
        'Ces choix ne sont pas décoratifs : ils déterminent le matériel, le temps de tournage et les risques.',
      action: 'Ouvrez la fiche technique d’une caméra : usages et limites viennent d’une base locale.',
      animation: 'rise',
    },
    {
      id: 'prompt',
      route: (slug) => `${base(slug)}/plans`,
      target: '[data-tour="shot-inspector"]',
      title: 'Prompt préparé',
      explanation:
        'Museion compose deux prompts — image et vidéo — à partir des seuls paramètres validés du plan.',
      rationale:
        'La composition est déterministe : les mêmes réglages produisent toujours le même texte, sans modèle de langage.',
      action: 'Ouvrez « Prévisualisation du prompt » pour voir le texte et le contrat JSON, inactif.',
      animation: 'fade',
    },
    {
      id: 'previs',
      route: (slug) => `${base(slug)}/previs`,
      title: 'Prévisualisation',
      explanation:
        'Le blocking en volume : décors, personnages, tracés de déplacement, caméras et leurs frustums.',
      rationale:
        'La prévis permet de trancher un découpage avant d’engager une équipe.',
      action:
        'Aucun moteur 3D n’est construit. Le seul générateur actif reste le compositeur SVG local ; ComfyUI est envisagé comme moteur local futur, il n’est pas branché.',
      animation: 'fade',
    },
    {
      id: 'production',
      route: (slug) => `${base(slug)}/production`,
      title: 'Production',
      explanation:
        'File de travaux, statuts, assets temporaires, relances et erreurs.',
      rationale:
        'Une file rend visible ce qui coûte du temps machine, et ce qui attend une validation humaine.',
      action:
        'Aucune génération réelle n’est connectée : la file est vide et le restera tant qu’aucun moteur n’est autorisé.',
      animation: 'fade',
    },
    {
      id: 'review',
      route: (slug) => `${base(slug)}/review`,
      title: 'Review et bibliothèque',
      explanation:
        'Comparaison de versions, commentaires par plan, validation, puis archivage dans la bibliothèque.',
      rationale:
        'Le cycle de vie des assets est déjà en place : temporaire, candidat, validé, canonique, archivé, supprimé.',
      action:
        'Un asset supprimé ne peut plus jamais redevenir validé. Cette règle est appliquée dans le modèle, pas seulement dans l’écran.',
      animation: 'fade',
    },
    {
      id: 'deliverables',
      route: (slug) => `${base(slug)}/deliverables`,
      title: 'Livrables',
      explanation:
        'Sélection des éléments retenus, validation finale, export et livraison.',
      rationale:
        'Le livrable est la seule chose qui sort du studio : il doit être traçable jusqu’à la décision qui l’a produit.',
      animation: 'fade',
    },
    {
      id: 'end',
      route: base,
      title: 'Vous avez fait le tour',
      explanation:
        'Vous avez parcouru la chaîne complète : développement, storyboard, tableau dynamique, plans, et les étapes encore à construire.',
      rationale:
        'Gilgamesh reste une démonstration : vous pouvez la réinitialiser, la rejouer, ou la dupliquer comme projet personnel.',
      nextLabel: 'Terminer',
      animation: 'fade',
    },
  ],
}

export const TOURS: DemoTour[] = [GILGAMESH_TOUR]

export function getTour(id: string | null): DemoTour | undefined {
  if (!id) return undefined
  return TOURS.find((t) => t.id === id)
}
