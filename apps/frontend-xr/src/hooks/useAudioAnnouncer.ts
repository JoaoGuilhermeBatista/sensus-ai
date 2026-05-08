import { useRef, useCallback } from 'react'
import type { ObjetoDetectado } from '../types/ObjetoDetectado'

// How long (ms) before the same object can be announced again per distance
const DEBOUNCE_MS: Record<string, number> = {
  perto: 3_000,
  medio: 8_000,
  longe: 15_000,
}

const MAX_OBJECTS_PER_CYCLE = 2

const PT_LABEL: Record<string, string> = {
  person: 'pessoa', bicycle: 'bicicleta', car: 'carro', motorcycle: 'moto',
  bus: 'ônibus', truck: 'caminhão', chair: 'cadeira', couch: 'sofá',
  bed: 'cama', 'dining table': 'mesa', toilet: 'vaso sanitário', tv: 'tv',
  laptop: 'notebook', 'cell phone': 'celular', bottle: 'garrafa',
  backpack: 'mochila', bench: 'banco', umbrella: 'guarda-chuva',
  sink: 'pia', refrigerator: 'geladeira', book: 'livro',
}

function ptOf(name: string): string {
  return PT_LABEL[name.toLowerCase()] ?? name
}

function buildMessage(obj: ObjetoDetectado): string {
  const label = ptOf(obj.nome)
  if (obj.isClose) return `Atenção! ${label}, muito próximo`
  if (obj.distancia === 'medio') return `${label}, à distância média`
  return `${label} detectado`
}

function priorityScore(obj: ObjetoDetectado): number {
  if (obj.isClose) return 3
  if (obj.distancia === 'medio') return 2
  return 1
}

export function useAudioAnnouncer() {
  // Maps object name → timestamp of last announcement
  const lastAnnounced = useRef<Map<string, number>>(new Map())

  const announce = useCallback((objects: ObjetoDetectado[], enabled: boolean) => {
    if (!enabled || objects.length === 0) return
    if (typeof speechSynthesis === 'undefined') return

    const now = Date.now()

    const eligible = objects
      .filter(obj => {
        const last = lastAnnounced.current.get(obj.nome) ?? 0
        return now - last >= DEBOUNCE_MS[obj.distancia]
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, MAX_OBJECTS_PER_CYCLE)

    for (const obj of eligible) {
      const utterance = new SpeechSynthesisUtterance(buildMessage(obj))
      utterance.lang = 'pt-BR'
      utterance.rate = obj.isClose ? 1.15 : 1.0
      utterance.pitch = obj.isClose ? 1.2 : 1.0
      try {
        speechSynthesis.speak(utterance)
        lastAnnounced.current.set(obj.nome, now)
      } catch {
        // speech synthesis unavailable — skip silently
      }
    }
  }, [])

  const reset = useCallback(() => {
    lastAnnounced.current.clear()
  }, [])

  return { announce, reset }
}
