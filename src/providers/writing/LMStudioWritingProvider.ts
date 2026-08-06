import { WritingProvider } from './WritingProvider'
import { WritingMission, WritingMessage, WritingTarget } from '@/lib/types-sprint4'
import { generateId } from '@/lib/utils'

const TARGET_INSTRUCTIONS: Record<WritingTarget, string> = {
  vision: "Tu aides à préciser la vision artistique d'un film : thème, ton, univers, promesse au spectateur.",
  logline: 'Tu aides à formuler une logline percutante en une ou deux phrases : protagoniste, enjeu, obstacle.',
  synopsis: "Tu aides à structurer un synopsis en trois actes, clair et fidèle au ton du projet.",
  treatment: 'Tu aides à développer un traitement : séquences clés, motivations, rythme.',
  characters: 'Tu aides à approfondir des personnages : failles, arcs, relations.',
  script: 'Tu aides à écrire des extraits de scénario au format standard (dialogue, action).',
}

function systemPromptFor(mission: WritingMission): string {
  const instruction = TARGET_INSTRUCTIONS[mission.target]
  return [
    'Tu es un assistant scénaristique pour Museion, un outil de production cinéma.',
    instruction,
    mission.context ? `Contexte fourni par l'utilisateur :\n${mission.context}` : '',
    "Réponds en français, de façon concise et directement exploitable. N'invente jamais de faits sur le projet au-delà du contexte fourni.",
  ]
    .filter(Boolean)
    .join('\n\n')
}

export const lmStudioWritingProvider: WritingProvider = {
  id: 'lmstudio',
  label: 'LM Studio (local)',
  isSimulation: false,
  isActive: true,

  async generate(mission: WritingMission, history: WritingMessage[]): Promise<WritingMessage> {
    const messages = [
      { role: 'system' as const, content: systemPromptFor(mission) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]

    const res = await fetch('/api/bridge/lmstudio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error ?? `Le pont LM Studio a répondu ${res.status}.`)
    }

    return {
      id: generateId(),
      missionId: mission.id,
      role: 'assistant',
      content: data.content as string,
      classification: 'hypothesis',
      createdAt: new Date().toISOString(),
    }
  },
}
