import type { ObjetoDetectado } from '../types/ObjetoDetectado'

export type Direction = 'esquerda' | 'centro' | 'direita' | null

// Thresholds for the normalized center-x of the bounding box
const LEFT_THRESHOLD = 1 / 3
const RIGHT_THRESHOLD = 2 / 3

/**
 * Derives the horizontal direction of an object from its normalized bbox.
 * Returns null when bbox coordinates are unavailable.
 */
export function computeDirection(obj: ObjetoDetectado): Direction {
  const x = obj.bboxX ?? (obj as any).bbox_x
  const w = obj.bboxWidth ?? (obj as any).bbox_width
  if (x == null || w == null) return null

  const centerX = x + w / 2
  if (centerX < LEFT_THRESHOLD) return 'esquerda'
  if (centerX > RIGHT_THRESHOLD) return 'direita'
  return 'centro'
}

const PT_LABEL: Record<string, string> = {
  person: 'pessoa', bicycle: 'bicicleta', car: 'carro', motorcycle: 'moto',
  bus: 'ônibus', truck: 'caminhão', chair: 'cadeira', couch: 'sofá',
  bed: 'cama', 'dining table': 'mesa', toilet: 'vaso sanitário', tv: 'tv',
  laptop: 'notebook', 'cell phone': 'celular', bottle: 'garrafa',
  backpack: 'mochila', bench: 'banco', sink: 'pia',
}

function ptOf(name: string): string {
  return PT_LABEL[name.toLowerCase()] ?? name
}

const DIRECTION_PHRASE: Record<NonNullable<Direction>, string> = {
  esquerda: 'à esquerda',
  centro: 'à frente',
  direita: 'à direita',
}

/**
 * Builds a Portuguese TTS string that includes object name, direction and proximity.
 *
 * Examples:
 *   "Atenção! Pessoa à esquerda, muito próxima"
 *   "Mesa à frente, à distância média"
 *   "Cadeira à direita detectada"
 */
export function buildDirectionalMessage(obj: ObjetoDetectado): string {
  const label = ptOf(obj.nome)
  const dir = computeDirection(obj)
  const dirPhrase = dir ? ` ${DIRECTION_PHRASE[dir]}` : ''

  if (obj.isClose) return `Atenção! ${label}${dirPhrase}, muito próxima`
  if (obj.distancia === 'medio') return `${label}${dirPhrase}, à distância média`
  return `${label}${dirPhrase} detectada`
}
