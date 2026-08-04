// ============================================================
// MUSEION — Base de connaissances Caméra & Optiques
// Données locales, extensibles, aucune requête réseau.
// ============================================================

import type {
  CameraKnowledgeEntry,
  LensKnowledgeEntry,
  CameraMovement,
  ShotType,
} from '@/lib/types-storyboard'

/**
 * Avertissement affiché partout où ces fiches sont exploitées.
 * Une image simulée ne prouve jamais l'usage réel d'un matériel.
 */
export const KNOWLEDGE_DISCLAIMER =
  'Fiches techniques indicatives. Une simulation esthétique ne prouve jamais l’usage réel d’une caméra ou d’une optique.'

// ------------------------------------------------------------
// Types de plans
// ------------------------------------------------------------

export interface ShotTypeEntry {
  id: ShotType
  label: string
  abbreviation: string
  description: string
  typicalFocal: string
  promptFragment: string
}

export const SHOT_TYPES: ShotTypeEntry[] = [
  {
    id: 'extreme-wide',
    label: 'Plan très large',
    abbreviation: 'PTL',
    description: 'Le décor domine, le personnage est minuscule ou absent. Sert à situer le monde.',
    typicalFocal: '14–24 mm',
    promptFragment: 'plan très large, personnage minuscule dans un décor immense',
  },
  {
    id: 'wide',
    label: 'Plan large',
    abbreviation: 'PL',
    description: 'Personnage entier lisible dans son environnement. Équilibre corps / décor.',
    typicalFocal: '24–35 mm',
    promptFragment: 'plan large, personnage en pied dans son environnement',
  },
  {
    id: 'medium',
    label: 'Plan moyen',
    abbreviation: 'PM',
    description: 'Cadrage à mi-cuisses. Lecture du corps et du geste, décor encore présent.',
    typicalFocal: '35–50 mm',
    promptFragment: 'plan moyen, cadrage à mi-cuisses',
  },
  {
    id: 'american',
    label: 'Plan américain',
    abbreviation: 'PA',
    description: 'Coupe aux genoux. Hérité du western, tient deux à trois personnages.',
    typicalFocal: '35–50 mm',
    promptFragment: 'plan américain, cadrage aux genoux',
  },
  {
    id: 'medium-close',
    label: 'Plan rapproché',
    abbreviation: 'PR',
    description: 'Buste. Le visage devient le sujet sans écraser le contexte.',
    typicalFocal: '50–85 mm',
    promptFragment: 'plan rapproché poitrine, visage lisible',
  },
  {
    id: 'close',
    label: 'Gros plan',
    abbreviation: 'GP',
    description: 'Visage plein cadre. Émotion, décision, bascule dramatique.',
    typicalFocal: '85–135 mm',
    promptFragment: 'gros plan sur le visage, émotion lisible',
  },
  {
    id: 'extreme-close',
    label: 'Très gros plan',
    abbreviation: 'TGP',
    description: 'Fragment du visage : œil, bouche, main. Tension maximale.',
    typicalFocal: '100–180 mm',
    promptFragment: 'très gros plan, fragment de visage, tension',
  },
  {
    id: 'insert',
    label: 'Insert',
    abbreviation: 'INS',
    description: 'Détail narratif isolé : objet, inscription, arme, document.',
    typicalFocal: '50–100 mm',
    promptFragment: 'insert sur un détail narratif isolé',
  },
  {
    id: 'macro',
    label: 'Macro',
    abbreviation: 'MAC',
    description: 'Échelle matière : grain de pierre, poussière, gouttes, texture.',
    typicalFocal: '60–100 mm macro',
    promptFragment: 'macro, texture et matière à très courte distance',
  },
  {
    id: 'pov',
    label: 'POV',
    abbreviation: 'POV',
    description: 'Point de vue subjectif du personnage. Immersion directe.',
    typicalFocal: '24–35 mm',
    promptFragment: 'point de vue subjectif à hauteur de regard',
  },
]

export const SHOT_TYPE_LABELS: Record<ShotType, string> = SHOT_TYPES.reduce(
  (acc, entry) => ({ ...acc, [entry.id]: entry.label }),
  {} as Record<ShotType, string>
)

export function getShotType(id: ShotType): ShotTypeEntry | undefined {
  return SHOT_TYPES.find((s) => s.id === id)
}

// ------------------------------------------------------------
// Mouvements de caméra
// ------------------------------------------------------------

export interface CameraMovementEntry {
  id: CameraMovement
  label: string
  description: string
  rig: string
  promptFragment: string
}

export const CAMERA_MOVEMENTS: CameraMovementEntry[] = [
  {
    id: 'static',
    label: 'Fixe',
    description: 'Aucun déplacement. Le cadre est un tableau, le mouvement vient de la scène.',
    rig: 'Trépied / tête fluide',
    promptFragment: 'caméra fixe, cadre stable',
  },
  {
    id: 'pan',
    label: 'Panoramique',
    description: 'Rotation horizontale sur axe fixe. Révèle un espace ou suit un déplacement.',
    rig: 'Trépied / tête fluide',
    promptFragment: 'panoramique horizontal',
  },
  {
    id: 'tilt',
    label: 'Tilt',
    description: 'Rotation verticale sur axe fixe. Révèle une hauteur ou écrase un personnage.',
    rig: 'Trépied / tête fluide',
    promptFragment: 'tilt vertical',
  },
  {
    id: 'dolly-in',
    label: 'Travelling avant',
    description: 'La caméra avance physiquement. Rapprochement, engagement, montée de tension.',
    rig: 'Dolly sur rails',
    promptFragment: 'travelling avant lent',
  },
  {
    id: 'dolly-out',
    label: 'Travelling arrière',
    description: 'La caméra recule. Abandon, révélation du contexte, respiration finale.',
    rig: 'Dolly sur rails',
    promptFragment: 'travelling arrière',
  },
  {
    id: 'dolly-lateral',
    label: 'Travelling latéral',
    description: 'Déplacement parallèle au sujet. Accompagnement, parallaxe forte.',
    rig: 'Dolly sur rails / slider',
    promptFragment: 'travelling latéral, parallaxe marquée',
  },
  {
    id: 'push-in',
    label: 'Push-in',
    description: 'Resserrement lent et continu sur le sujet. Intériorité, prise de conscience.',
    rig: 'Dolly ou tête motorisée',
    promptFragment: 'push-in lent et continu',
  },
  {
    id: 'pull-out',
    label: 'Pull-out',
    description: 'Élargissement lent. Le sujet se dissout dans son monde.',
    rig: 'Dolly ou tête motorisée',
    promptFragment: 'pull-out progressif',
  },
  {
    id: 'orbital',
    label: 'Orbitale',
    description: 'Rotation autour du sujet. Sacralisation ou vertige selon la vitesse.',
    rig: 'Dolly courbe / gimbal',
    promptFragment: 'mouvement orbital autour du sujet',
  },
  {
    id: 'crane',
    label: 'Grue',
    description: 'Déplacement vertical ample. Ouverture, fin de séquence, ampleur.',
    rig: 'Grue / techno-crane',
    promptFragment: 'mouvement de grue ample',
  },
  {
    id: 'handheld',
    label: 'Caméra portée',
    description: 'Instabilité assumée. Urgence, désordre, réalisme brut.',
    rig: 'Épaule',
    promptFragment: 'caméra portée, instabilité organique',
  },
  {
    id: 'steadicam',
    label: 'Steadicam',
    description: 'Fluidité continue en marchant. Suivi long sans coupe.',
    rig: 'Steadicam / gimbal stabilisé',
    promptFragment: 'steadicam fluide',
  },
  {
    id: 'dolly-zoom',
    label: 'Dolly zoom',
    description: 'Travelling et zoom inversés. Le fond se déforme, le sujet reste. Vertige.',
    rig: 'Dolly + zoom asservi',
    promptFragment: 'dolly zoom, déformation de la perspective',
  },
]

export const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = CAMERA_MOVEMENTS.reduce(
  (acc, entry) => ({ ...acc, [entry.id]: entry.label }),
  {} as Record<CameraMovement, string>
)

export function getCameraMovement(id: CameraMovement): CameraMovementEntry | undefined {
  return CAMERA_MOVEMENTS.find((m) => m.id === id)
}

// ------------------------------------------------------------
// Caméras
// ------------------------------------------------------------

export const CAMERAS: CameraKnowledgeEntry[] = [
  {
    id: 'cam-alexa-35',
    name: 'ARRI Alexa 35',
    manufacturer: 'ARRI',
    sensor: 'Super 35 — ALEV 4 CMOS (27,99 × 19,22 mm)',
    resolution: '4,6K open gate (4608 × 3164)',
    dynamicRange: '17 diaphs annoncés par le constructeur',
    focalRange: 'Monture LPL — adaptée aux séries 25 à 135 mm',
    ratios: ['4:3 open gate', '16:9', '1.85:1', '2.39:1'],
    uses: [
      'Reconstitution historique en lumière difficile',
      'Nuit américaine et contre-jour extrême',
      'Peau et textures minérales',
    ],
    limits: [
      'Poids du corps complet en caméra portée longue durée',
      'Débit de données élevé en ARRIRAW open gate',
      'Champ plus étroit qu’un grand format à focale égale',
    ],
    notes: 'Référence Museion pour les séquences d’Uruk : latitude d’exposition et rendu peau.',
  },
  {
    id: 'cam-alexa-mini-lf',
    name: 'ARRI Alexa Mini LF',
    manufacturer: 'ARRI',
    sensor: 'Grand format — ALEV III (36,70 × 25,54 mm)',
    resolution: '4,5K LF open gate (4448 × 3096)',
    dynamicRange: '14+ diaphs',
    focalRange: 'Monture LPL — séries grand format 15 à 200 mm',
    ratios: ['1.55:1 open gate', '16:9', '2.39:1'],
    uses: [
      'Plans larges de paysage avec séparation douce',
      'Steadicam et grue grâce au corps compact',
      'Portraits monumentaux',
    ],
    limits: [
      'Optiques grand format encombrantes et coûteuses',
      'Profondeur de champ très courte à pleine ouverture',
      'Vignettage avec certaines optiques Super 35',
    ],
    notes: 'Employée pour les plans d’ampleur : plaine, déluge, retour à Uruk.',
  },
  {
    id: 'cam-venice-2',
    name: 'Sony VENICE 2',
    manufacturer: 'Sony',
    sensor: 'Plein format CMOS 8,6K (35,9 × 24,0 mm)',
    resolution: '8,6K (8640 × 5760) ou 6K selon le bloc capteur',
    dynamicRange: '16 diaphs annoncés',
    focalRange: 'Monture E native, adaptateur PL fourni',
    ratios: ['3:2 open gate', '17:9', '2.39:1'],
    uses: [
      'Double ISO natif pour les scènes nocturnes',
      'Filtres ND internes en extérieur plein soleil',
      'Cadrages larges avec recadrage en post',
    ],
    limits: [
      'Fichiers X-OCN lourds en 8,6K',
      'Rendu colorimétrique à étalonner finement pour l’historique',
      'Autonomie réduite en configuration complète',
    ],
    notes: 'Retenue pour les intérieurs nuit du palais et les torches.',
  },
  {
    id: 'cam-v-raptor',
    name: 'RED V-RAPTOR 8K VV',
    manufacturer: 'RED',
    sensor: 'Vista Vision CMOS (40,96 × 21,60 mm)',
    resolution: '8K VV (8192 × 4320)',
    dynamicRange: '17 diaphs annoncés par le constructeur',
    focalRange: 'Monture RF / PL selon configuration',
    ratios: ['17:9', '2:1', '2.39:1'],
    uses: [
      'Ralentis jusqu’à 120 i/s en 8K',
      'Plans d’action et de combat',
      'Corps léger pour gimbal',
    ],
    limits: [
      'Gestion thermique en tournage désert',
      'Workflow R3D exigeant en post',
      'Rolling shutter perceptible sur mouvements très rapides',
    ],
    notes: 'Réservée aux séquences de combat Gilgamesh / Enkidu.',
  },
  {
    id: 'cam-ursa-cine-12k',
    name: 'Blackmagic URSA Cine 12K LF',
    manufacturer: 'Blackmagic Design',
    sensor: 'Grand format RGBW 12K (36,0 × 24,0 mm)',
    resolution: '12K (12288 × 8040)',
    dynamicRange: '16 diaphs annoncés',
    focalRange: 'Monture PL / EF interchangeable',
    ratios: ['3:2 open gate', '16:9', '2.39:1'],
    uses: [
      'Plans à haute densité de détail (architecture, foule)',
      'Budget maîtrisé sur seconde équipe',
      'Enregistrement Blackmagic RAW efficace',
    ],
    limits: [
      'Ergonomie moins souple en portée',
      'Écosystème accessoires plus restreint',
      'Nécessite un stockage rapide dédié',
    ],
    notes: 'Seconde équipe : plans de ville et de foule.',
  },
  {
    id: 'cam-c500-mkii',
    name: 'Canon EOS C500 Mark II',
    manufacturer: 'Canon',
    sensor: 'Plein format CMOS (38,1 × 20,1 mm)',
    resolution: '5,9K (5952 × 3140)',
    dynamicRange: '15+ diaphs',
    focalRange: 'Monture EF / PL modulaire',
    ratios: ['17:9', '16:9', '2.39:1'],
    uses: [
      'Documentaire de tournage et making-of',
      'Stabilisation électronique intégrée',
      'Configuration légère et autonome',
    ],
    limits: [
      'Moins de latitude que les caméras haut de gamme',
      'Ventilation audible en environnement silencieux',
      'Rendu à harmoniser avec les caméras principales',
    ],
    notes: 'Caméra de captation annexe, jamais caméra principale sur Gilgamesh.',
  },
]

export function getCamera(id: string): CameraKnowledgeEntry | undefined {
  return CAMERAS.find((c) => c.id === id || c.name === id)
}

// ------------------------------------------------------------
// Optiques
// ------------------------------------------------------------

export const LENSES: LensKnowledgeEntry[] = [
  {
    id: 'lens-signature-prime',
    name: 'ARRI Signature Prime',
    type: 'prime',
    focalLength: '12 à 280 mm (série)',
    aperture: 'T1.8',
    character: 'Rendu doux et organique, bokeh circulaire, faible contraste de micro-détail',
    uses: ['Visages', 'Scènes nocturnes', 'Grand format'],
    notes: 'Série de référence pour les plans rapprochés sur Gilgamesh et Enkidu.',
  },
  {
    id: 'lens-cooke-s7i',
    name: 'Cooke S7/i Full Frame Plus',
    type: 'prime',
    focalLength: '18 à 300 mm (série)',
    aperture: 'T2.0',
    character: 'Cooke Look : peau chaude, transition de netteté progressive',
    uses: ['Portraits', 'Intérieurs bougie', 'Dialogues'],
    notes: 'Chaleur naturelle utile pour les torches et le clair-obscur.',
  },
  {
    id: 'lens-zeiss-supreme',
    name: 'ZEISS Supreme Prime',
    type: 'prime',
    focalLength: '15 à 200 mm (série)',
    aperture: 'T1.5',
    character: 'Neutre, très propre, contrôle du flare maîtrisé',
    uses: ['Plans larges d’architecture', 'Effets visuels', 'Continuité colorimétrique'],
    notes: 'Choisi pour les plans nécessitant un tracking VFX propre.',
  },
  {
    id: 'lens-panavision-c',
    name: 'Panavision C-Series anamorphique',
    type: 'prime',
    focalLength: '40 à 100 mm (série)',
    aperture: 'T2.8',
    character: 'Anamorphique 2x : flares horizontaux, bokeh ovale, déformation de bord',
    uses: ['Épopée', 'Format 2.39:1', 'Plans de bataille'],
    notes: 'Utilisé avec parcimonie — le flare doit rester une décision, pas un réflexe.',
  },
  {
    id: 'lens-leitz-thalia',
    name: 'Leitz THALIA',
    type: 'prime',
    focalLength: '24 à 180 mm (série)',
    aperture: 'T2.6 à T3.6',
    character: 'Couverture très large, rendu doux en périphérie',
    uses: ['Grand format', 'Paysages', 'Plans très larges'],
    notes: 'Pertinent pour la plaine d’Uruk et le déluge.',
  },
  {
    id: 'lens-angenieux-optimo',
    name: 'Angénieux Optimo 24-290',
    type: 'zoom',
    focalLength: '24 à 290 mm',
    aperture: 'T2.8',
    character: 'Zoom long homogène, contraste maîtrisé sur toute la plage',
    uses: ['Seconde équipe', 'Plans de foule', 'Longue focale sur décor'],
    notes: 'Poids important : nécessite une tête et un pied adaptés.',
  },
  {
    id: 'lens-optimo-ultra-compact',
    name: 'Angénieux Optimo Ultra Compact 21-56',
    type: 'zoom',
    focalLength: '21 à 56 mm',
    aperture: 'T2.9',
    character: 'Compact, cohérent avec les séries primes modernes',
    uses: ['Steadicam', 'Caméra portée', 'Plans de suivi'],
    notes: 'Le compromis retenu pour les longs plans-séquences dans la cité.',
  },
  {
    id: 'lens-macro-100',
    name: 'Optique macro 100 mm',
    type: 'prime',
    focalLength: '100 mm',
    aperture: 'T2.9',
    character: 'Rapport 1:1, netteté extrême sur plan très rapproché',
    uses: ['Inserts', 'Macro matière', 'Tablettes cunéiformes'],
    notes: 'Profondeur de champ de quelques millimètres : mise au point critique.',
  },
]

export function getLens(id: string): LensKnowledgeEntry | undefined {
  return LENSES.find((l) => l.id === id || l.name === id)
}

// ------------------------------------------------------------
// Ratios, cadences, angles, hauteurs
// ------------------------------------------------------------

export const RATIOS = ['1.33:1', '1.66:1', '1.85:1', '2:1', '2.39:1', '2.76:1']

export const FRAME_RATES = [24, 25, 30, 48, 60, 96, 120]

export const CAMERA_ANGLES = [
  'Niveau du regard',
  'Légère plongée',
  'Plongée',
  'Léger contre-plongée',
  'Contre-plongée',
  'Vue zénithale',
  'Angle hollandais',
]

export const CAMERA_HEIGHTS = [
  '0,30 m — au sol',
  '0,90 m — hauteur de table',
  '1,20 m — hauteur d’enfant',
  '1,60 m — hauteur de regard',
  '1,80 m — au-dessus du regard',
  '3,00 m — surélevée',
  '12,00 m — grue haute',
]
