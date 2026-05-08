import { useRef, useCallback } from 'react'
import type { ObjetoDetectado } from '../types/ObjetoDetectado'
import { buildDirectionalMessage } from '../utils/direction.utils'

// How long (ms) before the same object can be announced again per distance
const DEBOUNCE_MS: Record<string, number> = {
  perto: 3_000,
  medio: 8_000,
  longe: 15_000,
}

const MAX_OBJECTS_PER_CYCLE = 2

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
        return now - last >= (DEBOUNCE_MS[obj.distancia] ?? 5_000)
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, MAX_OBJECTS_PER_CYCLE)

    for (const obj of eligible) {
      const utterance = new SpeechSynthesisUtterance(buildDirectionalMessage(obj))
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
