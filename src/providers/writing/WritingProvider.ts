import { WritingMission, WritingMessage } from '@/lib/types-sprint4'

export interface WritingProvider {
  readonly id: string
  readonly label: string
  readonly isSimulation: boolean
  readonly isActive: boolean
  generate(mission: WritingMission, history: WritingMessage[]): Promise<WritingMessage>
}

export const WRITING_SIMULATION_DISCLAIMER = 'Proposition locale simulée — aucune IA appelée.'
