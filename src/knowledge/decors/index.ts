// ============================================================
// MUSEION — Base de connaissances Décors
// Fiches locales du projet Gilgamesh. Aucune requête réseau.
// ============================================================

import type { DecorReference } from '@/lib/types-storyboard'

export const DECOR_REFERENCES: DecorReference[] = [
  {
    id: 'decor-uruk-walls',
    name: 'Uruk — Les murs',
    identity:
      'La muraille de brique cuite qui fait la fierté du roi. Premier et dernier plan du film.',
    architecture:
      'Enceinte de 9 km, tours rectangulaires régulières, chemin de ronde large, portes voûtées en arc surbaissé.',
    materials: 'Brique crue et brique cuite, bitume, roseau tressé, enduit de chaux par endroits',
    palette: 'Ocre clair, terre brûlée, sable, ombres bleutées en fin de journée',
    era: 'Uruk IV — environ 2700 av. J.-C.',
    geography: 'Basse Mésopotamie, rive gauche de l’Euphrate, plaine alluviale',
    props: 'Bannières de lin, paniers de porteurs, échelles de charpentier, jarres à eau',
    lighting: 'Contre-jour doré en fin de journée, lumière naturelle latérale le matin',
    continuity:
      'La muraille est intacte au premier bloc, ébréchée après le déluge. Ne jamais mélanger les deux états.',
    references: ['Relevés archéologiques d’Uruk-Warka', 'Briques cuites du temple d’Eanna'],
  },
  {
    id: 'decor-throne-room',
    name: 'Palais d’Uruk — Salle du trône',
    identity: 'Le lieu du pouvoir absolu, écrasant, sans fenêtre au niveau du regard.',
    architecture:
      'Salle longitudinale, piliers de brique à mosaïque de cônes, estrade surélevée à trois marches, plafond de troncs de palmier.',
    materials: 'Brique, cônes d’argile peints, bois de cèdre importé, cuivre battu',
    palette: 'Noir profond, ocre, rouge sombre, éclats de cuivre',
    era: 'Uruk IV',
    geography: 'Cœur de la cité, à l’est du temple d’Eanna',
    props: 'Trône de cèdre, brasero, tablettes cunéiformes, sceaux-cylindres, coupes de cuivre',
    lighting: 'Clair-obscur, lumière volumétrique par les ouvertures hautes, torches en pratiques',
    continuity:
      'Les torches ne sont allumées qu’après la scène 04. Le brasero reste au même emplacement dans tout le bloc.',
    references: ['Mosaïques de cônes d’Uruk', 'Reliefs du palais d’Assurnasirpal (pour l’échelle)'],
  },
  {
    id: 'decor-cedar-forest',
    name: 'Forêt des Cèdres',
    identity: 'Le monde d’avant les hommes, vertical, gardé par Humbaba. Territoire interdit.',
    architecture:
      'Aucune architecture. Colonnades naturelles de troncs, canopée fermée, clairières rares.',
    materials: 'Bois de cèdre, mousse, résine, roche calcaire humide',
    palette: 'Vert profond désaturé, gris-bleu, brun résineux',
    era: 'Hors temps — territoire mythique',
    geography: 'Montagnes du Levant, versant humide',
    props: 'Haches de bronze, cordes, torches, offrandes déposées',
    lighting: 'Lumière volumétrique en faisceaux, lumière diffuse sous canopée',
    continuity:
      'La brume est présente dans tous les plans de la forêt. Densité mesurée à chaque prise.',
    references: ['Cédraies du Chouf', 'Peintures de forêt de Caspar David Friedrich (pour l’échelle)'],
  },
  {
    id: 'decor-uruk-plain',
    name: 'Plaine d’Uruk',
    identity: 'L’espace du départ et du retour. Horizon bas, ciel dominant.',
    architecture: 'Canaux d’irrigation rectilignes, digues de terre, bornes de champs',
    materials: 'Limon, roseau, terre séchée, eau saumâtre',
    palette: 'Beige, or, vert pâle des roseaux, ciel blanc surexposé à midi',
    era: 'Uruk IV',
    geography: 'Delta de l’Euphrate, terrain plat sur 20 km',
    props: 'Barques de roseau, filets, troupeaux de chèvres, jougs',
    lighting: 'Contre-jour doré, lumière naturelle latérale, ciel voilé à midi',
    continuity:
      'Les canaux sont pleins avant le déluge, boueux après. Le troupeau disparaît du bloc 4.',
    references: ['Marais mésopotamiens actuels', 'Photographies des Ahwar d’Irak'],
  },
  {
    id: 'decor-ishtar-temple',
    name: 'Temple d’Ishtar',
    identity: 'Le sacré féminin, refusé par Gilgamesh. Lieu du basculement.',
    architecture:
      'Ziggurat à trois degrés, escalier axial monumental, sanctuaire sommital étroit.',
    materials: 'Brique cuite glaçurée, or appliqué, lapis-lazuli, albâtre',
    palette: 'Bleu lapis, or, blanc calcaire, ombre violacée',
    era: 'Uruk IV',
    geography: 'Terrasse sacrée d’Eanna, point le plus haut de la cité',
    props: 'Encensoirs, offrandes de grain, statuettes votives, voiles de lin',
    lighting: 'Lumière volumétrique, contre-jour doré au sommet, clair-obscur dans le sanctuaire',
    continuity:
      'Les voiles bougent toujours dans le même sens : vent venant de l’ouest.',
    references: ['Ziggurat d’Ur', 'Porte d’Ishtar de Babylone (palette uniquement)'],
  },
  {
    id: 'decor-euphrates',
    name: 'Euphrate — Rive et déluge',
    identity: 'Le fleuve nourricier devenu destructeur. Le décor qui change d’identité.',
    architecture: 'Quais de brique, embarcadères de bois, digues submersibles',
    materials: 'Eau chargée de limon, bois gorgé, brique délitée, boue',
    palette: 'Gris-brun, ardoise, écume blanche, ciel plombé',
    era: 'Uruk IV',
    geography: 'Cours principal de l’Euphrate à hauteur d’Uruk',
    props: 'Barques, amarres rompues, jarres flottantes, débris de toiture',
    lighting: 'Lumière diffuse plombée, lumière nocturne pour le pic du déluge',
    continuity:
      'Le niveau d’eau monte de manière strictement croissante d’une scène à l’autre. Jamais de retour en arrière.',
    references: ['Crues du Tigre documentées', 'Séquences de tempête en lumière diffuse'],
  },
  {
    id: 'decor-mashu',
    name: 'Montagne de Mashu',
    identity: 'Le passage vers l’au-delà. Deux pics jumeaux gardant le tunnel du soleil.',
    architecture: 'Formation rocheuse naturelle, tunnel taillé, portes gardées',
    materials: 'Roche noire volcanique, sel cristallisé, glace en altitude',
    palette: 'Noir minéral, blanc de sel, bleu glacé, un unique point chaud',
    era: 'Hors temps',
    geography: 'Chaîne montagneuse aux confins du monde connu',
    props: 'Bâton de marche, outre d’eau, torche unique',
    lighting: 'Lumière nocturne, clair-obscur, une seule source visible dans le tunnel',
    continuity:
      'La torche de Gilgamesh est la seule source dans le tunnel : aucune lumière d’appoint visible.',
    references: ['Tunnels de lave islandais', 'Salines d’altitude'],
  },
  {
    id: 'decor-utnapishtim',
    name: 'Marais d’Utnapishtim',
    identity: 'Le bout du voyage. Immobilité, eau plate, silence.',
    architecture: 'Huttes de roseau tressé (mudhif), plateformes flottantes',
    materials: 'Roseau, boue séchée, corde végétale, eau stagnante',
    palette: 'Vert-gris, beige délavé, reflets d’argent, ciel blanc',
    era: 'Hors temps',
    geography: 'Marais du sud mésopotamien, au-delà des eaux de la mort',
    props: 'Barque plate, nasses, plante de jeunesse, coquillages',
    lighting: 'Lumière diffuse, intérieur fenêtre dans le mudhif',
    continuity:
      'Aucun vent : la surface de l’eau reste plane dans tous les plans du bloc final.',
    references: ['Mudhifs des Ma’dan', 'Photographies de Wilfred Thesiger'],
  },
]

export function getDecor(id: string): DecorReference | undefined {
  return DECOR_REFERENCES.find((d) => d.id === id || d.name === id)
}

/**
 * Retrouve une fiche décor depuis un texte libre saisi dans un plan
 * ("Int. — Salle du trône", "Ext. — Plaine d'Uruk").
 */
export function resolveDecor(input: string | undefined): DecorReference | undefined {
  if (!input) return undefined
  const normalized = normalize(input)
  return DECOR_REFERENCES.find((decor) => {
    const name = normalize(decor.name)
    const tail = name.split('—').pop()?.trim() ?? name
    return normalized.includes(name) || (tail.length > 3 && normalized.includes(tail))
  })
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
}
