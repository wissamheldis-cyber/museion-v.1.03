import { createWorkflow } from '@/lib/workflow'
import type { WorkflowStepId, WorkflowStepStatus } from '@/lib/types'
import type {
  Project,
  Character,
  ScriptScene,
  ArtisticDossier,
  ProjectVision,
  Synopsis,
  Treatment,
} from './types'

// ============================================================
// DONNÉES DE DÉMONSTRATION — Museion Sprint 1
// ============================================================

const gilgameshVision: ProjectVision = {
  promise: "Redécouvrir l'épopée la plus ancienne de l'humanité à travers une épopée visuelle contemporaine.",
  intention: "Faire de Gilgamesh un miroir de notre propre rapport à la mort, à l'amitié et à ce que nous laissons derrière nous.",
  theme: "La mortalité comme condition de la grandeur. L'amitié comme seule réponse à l'absurde.",
  world: "Mésopotamie ancienne, entre 2700 et 2600 av. J.-C. Uruk, cité de briques crues. Déserts infinis. Cèdres millénaires. Fleuves sacrés.",
  conflict: "Gilgamesh, roi tyran devenu héros, perd son seul ami Enkidu. Incapable d'accepter la mort, il part à la recherche de l'immortalité — et revient les mains vides, mais transformé.",
  arc: "De la toute-puissance à l'acceptation. Du roi solitaire à l'homme qui comprend enfin ce qu'il a construit.",
  tone: "Grave, lyrique, épique sans ostentation. La beauté du deuil. Pas de musique triomphante.",
  audience: "Adultes, 30-55 ans, sensibles aux grandes questions existentielles et aux films de prestige.",
  duration: '2h15',
  references: [],
}

const gilgameshSynopsis: Synopsis = {
  short: "Le roi Gilgamesh règne sur Uruk d'une main de fer. L'arrivée d'Enkidu, homme sauvage envoyé par les dieux pour le défier, devient une amitié transformatrice. Quand Enkidu meurt, Gilgamesh part à la recherche de l'immortalité, voyage qui le ramène à lui-même.",
  long: "Gilgamesh, deux tiers dieu et un tiers homme, gouverne Uruk avec une autorité absolue et une soif de gloire qui terrifie son peuple. Les dieux créent Enkidu, être sauvage né de la terre, pour le contrebalancer. Leur première rencontre est un combat titanesque qui se transforme en fraternité indéfectible. Ensemble, ils tuent le Taureau du ciel et le gardien de la forêt de cèdres, Humbaba. Mais les dieux exigent une mort en paiement. Enkidu, condamné, dépérit et meurt dans les bras de Gilgamesh. Incapable d'accepter la perte, Gilgamesh traverse des terres inconnues, traverse les eaux de la mort, pour trouver Utnapishtim, le seul mortel devenu immortel. Celui-ci lui révèle le secret de la jeunesse éternelle — une plante au fond de l'eau. Gilgamesh la trouve, mais un serpent la lui vole. Il rentre à Uruk les mains vides. Devant les murs de sa ville qu'il a bâtis, il comprend : ce qu'il laisse derrière lui, c'est son immortalité.",
  beginning: "Uruk. Gilgamesh règne par la peur. Les dieux créent Enkidu. Gilgamesh et Enkidu se battent, puis deviennent frères.",
  development: "Expédition contre Humbaba. Victoire. Mort d'Enkidu. Errance de Gilgamesh à la recherche de l'immortalité. Voyage aux confins du monde.",
  resolution: "Gilgamesh perd la plante d'éternité. Retour à Uruk. Contemplation des murs qu'il a bâtis. Acceptation de la condition mortelle comme fondement de la grandeur.",
}

const gilgameshTreatment: Treatment = {
  actI: {
    content: "Uruk, cité d'or et de terreur. Gilgamesh règne. Son peuple l'accuse d'abus auprès des dieux. Aruru crée Enkidu dans le désert. Shamhat, prêtresse, l'initie à l'humanité. Enkidu arrive à Uruk. Le combat. La fraternité.",
    keyMoments: [
      "Scène d'ouverture : Gilgamesh inspecte les murs d'Uruk (il narrera plus tard cette même scène)",
      "Création d'Enkidu depuis la glaise",
      "Initiation d'Enkidu par Shamhat — passage de l'animalité à l'humanité",
      "Combat Gilgamesh / Enkidu — corps à corps épique",
      "Fraternité scellée — première nuit à parler sous les étoiles",
    ],
  },
  actII: {
    content: "Gilgamesh veut la gloire. Expédition dans la forêt de cèdres pour tuer Humbaba. Enkidu est réticent. Victoire. Ishtar tente de séduire Gilgamesh, essuie un refus cinglant. Les dieux condamnent Enkidu. Maladie. Mort.",
    keyMoments: [
      "Conseil avant le départ — Enkidu supplie Gilgamesh de renoncer",
      "Forêt de cèdres — beauté et terreur",
      "Mort de Humbaba — victoire creuse",
      "Refus d'Ishtar — monologue de Gilgamesh sur les amants abandonnés",
      "Mort du Taureau du ciel",
      "Maladie d'Enkidu — 12 jours d'agonie",
      "Mort d'Enkidu — scène centrale du film",
    ],
  },
  actIII: {
    content: "Gilgamesh ne se lave plus, s'habille de peaux. Errance. Voyage aux confins du monde, passage des montagnes jumelles gardées par des scorpions. Traversée des eaux de la mort. Utnapishtim. La plante. Le serpent. Retour.",
    keyMoments: [
      "Errance dans le désert — transformation physique",
      "Rencontre avec Siduri, cabaretière des confins",
      "Traversée des eaux de la mort avec le passeur Urshanabi",
      "Utnapishtim raconte le déluge",
      "La plante au fond de l'eau",
      "Le serpent vole la plante",
      "Retour devant les murs d'Uruk — épiphanie finale",
    ],
  },
  transformation: "Gilgamesh passe de la conviction d'être au-dessus de la mort à l'acceptation profonde de sa condition mortelle. Cette acceptation n'est pas une défaite — c'est une libération.",
  emotionalResolution: "Devant les murs d'Uruk, Gilgamesh ne pleure pas. Il regarde. Ce qu'il a construit survivra. L'immortalité qu'il cherchait était là depuis le début.",
}

const gilgameshCharacters: Character[] = [
  {
    id: 'char-gilgamesh',
    name: 'Gilgamesh',
    role: 'Protagoniste',
    objective: "Trouver l'immortalité pour ne pas mourir comme Enkidu",
    innerNeed: "Apprendre à accepter la perte et à trouver un sens dans la condition mortelle",
    contradiction: "Un dieu dans un corps d'homme qui refuse de se plier aux lois divines",
    arc: "De la toute-puissance tyrannique à la sagesse durement acquise",
    relations: [
      { characterId: 'char-enkidu', characterName: 'Enkidu', relationshipType: 'Frère de sang', description: "L'amitié la plus profonde, fondatrice, dont la perte provoque toute l'action du film" },
      { characterId: 'char-utnapishtim', characterName: 'Utnapishtim', relationshipType: 'Sage / Miroir', description: "Celui qui détient la réponse et qui révèle l'impossibilité de la quête" },
    ],
    appearance: "Grand, musclé, port royal. Barbe soignée noire. Yeux sombres et intenses. Cicatrices de batailles assumées.",
    costume: "Robe royale en laine brodée d'or (Acte I), peaux de lion après la mort d'Enkidu (Acte III)",
    continuityNotes: "Transformation physique progressive du roi au deuillant. Cheveux et barbe qui poussent pendant l'errance.",
    references: [],
    imageUrl: '/demo-gilgamesh/gilgamesh-char.jpg',
  },
  {
    id: 'char-enkidu',
    name: 'Enkidu',
    role: 'Deutéragoniste',
    objective: "Comprendre ce que c'est qu'être humain, puis protéger son frère",
    innerNeed: "Appartenir à quelque chose — trouver sa place entre nature et civilisation",
    contradiction: "Créé pour combattre Gilgamesh, il devient son seul ami",
    arc: "De la bête des champs à l'homme qui accepte sa mort avec dignité",
    relations: [
      { characterId: 'char-gilgamesh', characterName: 'Gilgamesh', relationshipType: 'Frère de sang', description: "Lien fondateur du film" },
      { characterId: 'char-shamhat', characterName: 'Shamhat', relationshipType: 'Initiatrice', description: "Elle l'a introduit à l'humanité" },
    ],
    appearance: "Corps sauvage, cheveux longs et emmêlés, yeux clairs et stupéfaits du monde. Force brute tempérée par la douceur.",
    costume: "Peaux d'animaux (Acte I), vêtements simples offerts par Gilgamesh (Acte II)",
    continuityNotes: "Dégradation physique progressive pendant les 12 jours de maladie",
    references: [],
    imageUrl: '/demo-gilgamesh/enkidu-char.jpg',
  },
  {
    id: 'char-shamhat',
    name: 'Shamhat',
    role: 'Secondaire — Catalyseur',
    objective: "Accomplir la mission des dieux : humaniser Enkidu",
    innerNeed: "Être vue comme une prêtresse, pas seulement comme un instrument",
    contradiction: "Femme de la cité envoyée dans le désert pour civiliser la bête",
    arc: "Présence discrète mais essentielle — elle disparaît mais son acte conditionne tout",
    relations: [
      { characterId: 'char-enkidu', characterName: 'Enkidu', relationshipType: 'Initiatrice / Amante', description: "7 jours et 7 nuits qui transforment Enkidu" },
    ],
    appearance: "Belle, déterminée, vêtements de prêtresse d'Ishtar, parure en lapis-lazuli",
    costume: "Robe de lin blanc, parure d'or, voile coloré",
    continuityNotes: "Présente uniquement en Acte I",
    references: [],
  },
  {
    id: 'char-utnapishtim',
    name: 'Utnapishtim',
    role: 'Secondaire — Gardien de la vérité',
    objective: "Tester Gilgamesh et lui révéler l'inutilité de sa quête",
    innerNeed: "Partager le fardeau de l'immortalité avec quelqu'un qui comprend",
    contradiction: "L'immortel qui enseigne à mourir",
    arc: "Figure statique — c'est le miroir de ce que Gilgamesh ne peut pas être",
    relations: [
      { characterId: 'char-gilgamesh', characterName: 'Gilgamesh', relationshipType: 'Sage / Antagoniste bienveillant', description: "Il donne la réponse mais elle n'est pas celle attendue" },
    ],
    appearance: "Très vieux, calme absolu, yeux d'une clarté surnaturelle",
    costume: "Vêtements simples, presque moines",
    continuityNotes: "Présent uniquement en Acte III",
    references: [],
  },
]

const gilgameshScript: { scenes: ScriptScene[] } = {
  scenes: [
    {
      id: 'scene-001',
      number: 1,
      title: 'Les murs d\'Uruk',
      location: 'Uruk — Remparts — Crépuscule',
      timeOfDay: 'EXT',
      order: 1,
      blocks: [
        {
          id: 'block-001-1',
          type: 'scene-heading',
          content: 'EXT. REMPARTS D\'URUK — CRÉPUSCULE',
          order: 1,
        },
        {
          id: 'block-001-2',
          type: 'action',
          content: 'Wind blows across the ramparts. A distant TOWER blinks over the dust.\n\nGILGAMESH, roi d\'Uruk, marche lentement le long du mur. Il pose sa main sur la brique.',
          order: 2,
        },
        {
          id: 'block-001-3',
          type: 'character',
          content: 'GILGAMESH',
          order: 3,
        },
        {
          id: 'block-001-4',
          type: 'dialogue',
          content: 'Ces murs. Regarde-les.\n\nTrente lieues de tour. Cinq lieues de jardins. Deux lieues pour le temple d\'Ishtar.',
          order: 4,
        },
        {
          id: 'block-001-5',
          type: 'action',
          content: 'Il regarde la ville en contrebas. Le bruit du marché monte jusqu\'à lui.',
          order: 5,
        },
        {
          id: 'block-001-6',
          type: 'character',
          content: 'GILGAMESH',
          order: 6,
        },
        {
          id: 'block-001-7',
          type: 'dialogue',
          content: 'C\'est moi qui ai fait ça.',
          order: 7,
        },
        {
          id: 'block-001-8',
          type: 'transition',
          content: 'FONDU AU NOIR.',
          order: 8,
        },
      ],
    },
    {
      id: 'scene-002',
      number: 2,
      title: 'La création d\'Enkidu',
      location: 'Désert — Aube',
      timeOfDay: 'EXT',
      order: 2,
      blocks: [
        {
          id: 'block-002-1',
          type: 'scene-heading',
          content: 'EXT. DÉSERT — AUBE',
          order: 1,
        },
        {
          id: 'block-002-2',
          type: 'action',
          content: 'La déesse ARURU s\'accroupit dans la poussière. Ses mains travaillent la glaise rouge. Lentement, une forme humaine prend vie.\n\nEnkidu ouvre les yeux. Il ne comprend pas encore ce qu\'il est.',
          order: 2,
        },
      ],
    },
    {
      id: 'scene-003',
      number: 3,
      title: 'Le combat',
      location: 'Uruk — Place centrale — Jour',
      timeOfDay: 'EXT',
      order: 3,
      blocks: [
        {
          id: 'block-003-1',
          type: 'scene-heading',
          content: 'EXT. PLACE D\'URUK — JOUR',
          order: 1,
        },
        {
          id: 'block-003-2',
          type: 'action',
          content: 'La foule s\'écarte. GILGAMESH et ENKIDU se font face.\n\nPas de mots. Ils se comprennent déjà.\n\nIls se précipitent l\'un vers l\'autre.',
          order: 2,
        },
        {
          id: 'block-003-3',
          type: 'note',
          content: 'NOTE : Ce combat doit être chorégraphié comme une danse — pas comme une bagarre. Deux forces égales qui se reconnaissent.',
          order: 3,
        },
        {
          id: 'block-003-4',
          type: 'action',
          content: 'Ils s\'arrêtent. Haletants. Un moment de silence.\n\nEnkidu sourit. Gilgamesh sourit.\n\nLa foule ne comprend pas ce qu\'elle vient de voir.',
          order: 4,
        },
      ],
    },
  ],
}

const gilgameshArtisticDossier: ArtisticDossier = {
  intentionNote: "Gilgamesh n'est pas un film de péplum. C'est une méditation sur ce que nous laissons derrière nous. La caméra doit toujours être au niveau de l'humanité — jamais au-dessus, jamais dans le spectacle gratuit.",
  visualDirection: "Influences : Terrence Malick pour la lumière naturelle et le rapport au cosmos. Denis Villeneuve pour la gravité et la précision formelle. Mizoguchi pour les plans larges et le sens du rituel.",
  colorPalette: "Ocre chaud (Uruk, vie) → Bleu-gris froid (voyage, mort) → Retour à l'ocre (acceptation). Pas de couleurs vives. Tout désaturé sauf les moments de mémoire.",
  lighting: "Lumière naturelle exclusive. Torches. Lune. Soleil de désert oblique. Pas d'éclairage artificiel narrativement injustifié.",
  sets: "Constructions pratiques pour Uruk (briques de terre crue). Décors naturels pour le voyage (déserts de Jordanie, forêts du Liban). Aucun recours aux fonds verts pour les plans larges.",
  costumes: "Recherche historique rigoureuse (époque sumérienne). Matières naturelles exclusivement : laine, lin, cuir, or. Évolution visible du costume de Gilgamesh selon son état intérieur.",
  staging: "Plans séquences favorisés. Coupes uniquement quand nécessaires. Caméra portée pour les moments d'intimité, steadicam pour les déplacements. Plans larges pour les scènes épiques.",
  cinemaReferences: "The Thin Red Line (Malick) — rapport à la nature et à la mort. Dune (Villeneuve) — épopée grave. Ugetsu Monogatari (Mizoguchi) — fluidité et mélancolie. Apocalypse Now — descente et transformation.",
  sound: "Son direct favorisé. Vent, sable, eau. Silence comme élément dramatique. Pas de musique extra-diégétique dans les scènes d'action.",
  music: "Compositeur : style chambre. Instruments à cordes anciens (lyre sumérienne, oud). Thème principal simple, peu de notes. S'intensifie uniquement sur les moments de deuil.",
  images: [],
}

// ============================================================
// PROJETS DE DÉMONSTRATION
// ============================================================

/** Avancement figé de la démonstration Gilgamesh. */
const DEMO_WORKFLOW_STATUS: Partial<Record<WorkflowStepId, WorkflowStepStatus>> = {
  idea: 'done',
  script: 'done',
  bible: 'done',
  characters: 'done',
  storyboard: 'in-progress',
  previs: 'todo',
  plans: 'in-progress',
}

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-gilgamesh',
    slug: 'gilgamesh',
    isDemo: true,
    demoVersion: '1.0.0',
    title: 'Gilgamesh',
    status: 'development',
    format: 'feature',
    genre: 'historical',
    logline: "Quand Gilgamesh, roi tout-puissant d'Uruk, perd son seul ami Enkidu, il part à la recherche de l'immortalité — et revient les mains vides mais enfin humain.",
    loglineHistory: [
      {
        id: 'logv-001',
        content: "Un roi mésopotamien part à la recherche de l'éternité après la mort de son ami.",
        wordCount: 14,
        savedAt: '2026-07-01T10:00:00Z',
        label: 'Version initiale',
      },
      {
        id: 'logv-002',
        content: "Gilgamesh, roi d'Uruk, perd son ami Enkidu et traverse le monde à la recherche de l'immortalité, pour découvrir que ce qu'il cherchait était derrière lui depuis le début.",
        wordCount: 31,
        savedAt: '2026-07-15T14:30:00Z',
        label: 'Version développée',
      },
      {
        id: 'logv-003',
        content: "Quand Gilgamesh, roi tout-puissant d'Uruk, perd son seul ami Enkidu, il part à la recherche de l'immortalité — et revient les mains vides mais enfin humain.",
        wordCount: 29,
        savedAt: '2026-07-28T09:15:00Z',
        label: 'Version validée',
      },
    ],
    vision: gilgameshVision,
    synopsis: gilgameshSynopsis,
    treatment: gilgameshTreatment,
    script: gilgameshScript,
    characters: gilgameshCharacters,
    artisticDossier: gilgameshArtisticDossier,
    traces: [
      {
        id: 'trace-001',
        projectId: 'gilgamesh',
    status: 'decision',
        content: 'Pas de narration en voix off — tout doit être montré.',
        context: 'Décision de mise en scène fondamentale',
        date: '2026-07-10T00:00:00Z',
      },
      {
        id: 'trace-002',
        projectId: 'gilgamesh',
    status: 'hypothesis',
        content: 'Tourner en Jordanie pour les scènes de désert.',
        toValidate: 'Budget et faisabilité logistique',
        date: '2026-07-20T00:00:00Z',
      },
      {
        id: 'trace-003',
        projectId: 'gilgamesh',
    status: 'open-question',
        content: 'Langue du film : français, anglais, ou sumérienne sous-titrée ?',
        priority: 'high',
        date: '2026-07-25T00:00:00Z',
      },
    ],
    workflow: createWorkflow(DEMO_WORKFLOW_STATUS),

    isFavorite: true,
    isArchived: false,
    coverImageUrl: '/demo-gilgamesh/cover.jpg',
    completionPercent: 62,
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-28T09:15:00Z',
    lastSavedAt: '2026-07-28T09:15:00Z',
  },
  {
    id: 'proj-akhenaton',
    slug: 'akhenaton',
    title: 'Akhenaton',
    status: 'pre-production',
    format: 'feature',
    genre: 'historical',
    logline: "Le pharaon Akhenaton abolit les dieux d'Égypte pour n'en garder qu'un seul — et perd son empire.",
    loglineHistory: [
      {
        id: 'logv-akh-001',
        content: "Le pharaon Akhenaton abolit les dieux d'Égypte pour n'en garder qu'un seul — et perd son empire.",
        wordCount: 18,
        savedAt: '2026-06-15T10:00:00Z',
        label: 'Version initiale',
      },
    ],
    characters: [],
    traces: [
      {
        id: 'trace-akh-001',
        projectId: 'proj-akhenaton',
        status: 'decision',
        content: "Adopter le point de vue d'Akhenaton, pas celui de ses opposants.",
        date: '2026-06-20T00:00:00Z',
      },
    ],
    workflow: createWorkflow(),

    isFavorite: true,
    isArchived: false,
    coverImageUrl: '/demo-akhenaton/cover.png',
    completionPercent: 35,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-07-10T14:00:00Z',
  },
  {
    id: 'proj-alexandre',
    slug: 'alexandre',
    title: 'Alexandre',
    status: 'development',
    format: 'feature',
    genre: 'historical',
    logline: "Alexandre le Grand à 32 ans : à bout de conquêtes, incapable de s'arrêter, se demandant pour la première fois pourquoi il avance encore.",
    loglineHistory: [
      {
        id: 'logv-alex-001',
        content: "Alexandre le Grand à 32 ans : à bout de conquêtes, incapable de s'arrêter, se demandant pour la première fois pourquoi il avance encore.",
        wordCount: 24,
        savedAt: '2026-07-05T10:00:00Z',
        label: 'Version initiale',
      },
    ],
    characters: [],
    traces: [],
    workflow: createWorkflow(),

    isFavorite: false,
    isArchived: false,
    coverImageUrl: '/demo-alexandre/cover.png',
    completionPercent: 22,
    createdAt: '2026-07-05T08:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
  },
  {
    id: 'proj-civilisation',
    slug: 'civilisation',
    title: 'Civilisation',
    status: 'concept',
    format: 'documentary',
    genre: 'documentary',
    logline: "Un voyage en 7 actes à travers les grandes civilisations disparues, pour comprendre pourquoi elles s'effondrent toujours pour les mêmes raisons.",
    loglineHistory: [
      {
        id: 'logv-civ-001',
        content: "Un voyage en 7 actes à travers les grandes civilisations disparues, pour comprendre pourquoi elles s'effondrent toujours pour les mêmes raisons.",
        wordCount: 23,
        savedAt: '2026-07-18T10:00:00Z',
        label: 'Version initiale',
      },
    ],
    characters: [],
    traces: [
      {
        id: 'trace-civ-001',
        projectId: 'gilgamesh',
    status: 'open-question',
        content: 'Format : 1 long documentaire ou série en 7 épisodes ?',
        priority: 'high',
        date: '2026-07-20T00:00:00Z',
      },
    ],
    workflow: createWorkflow(),

    isFavorite: false,
    isArchived: false,
    completionPercent: 10,
    createdAt: '2026-07-18T08:00:00Z',
    updatedAt: '2026-07-18T08:00:00Z',
  },
  {
    id: 'proj-documentaire',
    slug: 'documentaire-projet',
    title: 'Projet documentaire',
    status: 'concept',
    format: 'documentary',
    genre: 'documentary',
    logline: 'Un documentaire sur la mémoire collective des peuples sans écriture.',
    loglineHistory: [
      {
        id: 'logv-doc-001',
        content: 'Un documentaire sur la mémoire collective des peuples sans écriture.',
        wordCount: 11,
        savedAt: '2026-07-22T10:00:00Z',
        label: 'Brouillon',
      },
    ],
    characters: [],
    traces: [],
    workflow: createWorkflow(),

    isFavorite: false,
    isArchived: false,
    completionPercent: 5,
    createdAt: '2026-07-22T08:00:00Z',
    updatedAt: '2026-07-22T08:00:00Z',
  },
  {
    id: 'proj-sans-titre',
    slug: 'sans-titre',
    title: 'Projet sans titre',
    status: 'draft',
    format: 'short',
    genre: 'drama',
    logline: '',
    loglineHistory: [],
    characters: [],
    traces: [],
    workflow: createWorkflow(),

    isFavorite: false,
    isArchived: false,
    completionPercent: 0,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
]

export const DEMO_STUDIO_PROFILE = {
  id: 'profile-admin',
  name: 'administrateur',
  displayName: 'Administrateur',
  role: 'administrator' as const,
  createdAt: '2026-07-01T00:00:00Z',
}
