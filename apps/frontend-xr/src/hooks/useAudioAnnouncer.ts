import { useRef, useCallback } from 'react'
import type { ObjetoDetectado } from '../types/ObjetoDetectado'
import { buildDirectionalMessage } from '../utils/direction.utils'

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

async function fetchElevenLabsAudio(text: string, isClose: boolean): Promise<ArrayBuffer> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      isClose,
    }),
  })

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  return response.arrayBuffer()
}

function announceFallback(text: string, isClose: boolean): void {
  if (typeof speechSynthesis === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-BR'
  utterance.rate = isClose ? 1.15 : 1.0
  utterance.pitch = isClose ? 1.2 : 1.0
  try {
    speechSynthesis.speak(utterance)
  } catch {
    // speech synthesis unavailable — skip silently
  }
}

export function useAudioAnnouncer() {
  const lastAnnounced = useRef<Map<string, number>>(new Map())
  const audioCtxRef = useRef<AudioContext | null>(null)
  // Queue of pending audio buffers to play sequentially
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  function getAudioContext(): AudioContext {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  function playBuffer(ctx: AudioContext, buffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => resolve()
      source.start()
    })
  }

  const announce = useCallback((objects: ObjetoDetectado[], enabled: boolean) => {
    if (!enabled || objects.length === 0) return

    const now = Date.now()

    const eligible = objects
      .filter(obj => {
        const last = lastAnnounced.current.get(obj.nome) ?? 0
        return now - last >= (DEBOUNCE_MS[obj.distancia] ?? 5_000)
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, MAX_OBJECTS_PER_CYCLE)

    if (eligible.length === 0) return

    // Mark as announced immediately to prevent duplicate calls while audio loads
    for (const obj of eligible) {
      lastAnnounced.current.set(obj.nome, now)
    }

    // Chain onto the existing queue so announcements play sequentially
    queueRef.current = eligible.reduce((chain, obj) => {
      return chain.then(async () => {
        const text = buildDirectionalMessage(obj)
        try {
          const ctx = getAudioContext()
          if (ctx.state === 'suspended') await ctx.resume()
          const arrayBuffer = await fetchElevenLabsAudio(text, obj.isClose)
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          await playBuffer(ctx, audioBuffer)
        } catch {
          // ElevenLabs failed — fall back to browser TTS for this object
          announceFallback(text, obj.isClose)
        }
      })
    }, queueRef.current)
  }, [])

  const reset = useCallback(() => {
    lastAnnounced.current.clear()
  }, [])

  return { announce, reset }
}
