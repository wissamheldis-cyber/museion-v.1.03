import { WritingProvider, WRITING_SIMULATION_DISCLAIMER } from './WritingProvider'
import { WritingMission, WritingMessage } from '@/lib/types-sprint4'
import { generateId } from '@/lib/utils'

export const mockWritingProvider: WritingProvider = {
  id: 'mock-writing',
  label: 'Mock Writing Assistant',
  isSimulation: true,
  isActive: true,
  
  async generate(mission: WritingMission, _history: WritingMessage[]): Promise<WritingMessage> {
    // Delay for realism
    await new Promise(resolve => setTimeout(resolve, 800))
    
    let content = ''
    switch (mission.target) {
      case 'vision':
        content = `Voici une proposition pour la vision du projet, basée sur le contexte fourni :\n\n- Thème principal : Exploration de la nature humaine\n- Ton : Sombre, mélancolique\n- Style visuel : Clair-obscur avec une colorimétrie désaturée\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      case 'logline':
        content = `Proposition de logline :\n\nQuand [l'événement déclencheur] survient, [le protagoniste] doit [l'action principale] pour éviter [l'enjeu majeur], tout en affrontant [l'antagoniste/l'obstacle].\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      case 'synopsis':
        content = `Structure suggérée pour le synopsis :\n\n1. Acte I : Introduction et élément perturbateur\n2. Acte II : Développement et complications\n3. Acte III : Climax et résolution\n\nSouhaitez-vous que je détaille un acte particulier ?\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      case 'treatment':
        content = `Idées pour le traitement :\n\nDévelopper les séquences clés, préciser les motivations des personnages et le rythme des scènes.\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      case 'characters':
        content = `Pistes de développement pour les personnages :\n\n- Focus sur les failles psychologiques\n- Arcs d'évolution contrastés\n- Relations conflictuelles mais interdépendantes\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      case 'script':
        content = `Proposition d'extrait de scénario basée sur le contexte :\n\n[Nom] : (avec hésitation) Je ne suis pas sûr que nous devrions faire ça...\n\n${WRITING_SIMULATION_DISCLAIMER}`
        break
      default:
        content = `Voici une suggestion basée sur vos éléments :\n\n[Contenu simulé pour ${mission.target}]\n\n${WRITING_SIMULATION_DISCLAIMER}`
    }

    return {
      id: generateId(),
      missionId: mission.id,
      role: 'assistant',
      content,
      classification: 'hypothesis',
      createdAt: new Date().toISOString()
    }
  }
}
