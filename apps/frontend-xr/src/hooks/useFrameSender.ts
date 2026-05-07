import { useEffect, useRef } from 'react'
import { webSocketService } from '../services/websocket.service'
import { cameraService } from '../services/camera.service'
import { RateLimiter } from '../utils/rateLimiter.utils'
import { config } from '../config/app.config'
import type { WebSocketPayload } from '../types/WebSocketPayload'

export function useFrameSender(video: HTMLVideoElement | null, active: boolean) {
  const rateLimiter = useRef(new RateLimiter(config.FPS))
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !video) return

    const loop = () => {
      if (rateLimiter.current.canSend()) {
        const frame = cameraService.captureFrame(video)
        const base64 = frame.split(',')[1]

        if (base64) {
          const payload: WebSocketPayload = { tipo: 'imagem', dados: base64 }
          webSocketService.send(JSON.stringify(payload))
          console.log(`[FRAME] sent size=${Math.round((base64.length * 3) / 4 / 1024)}kb`)
        }
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [active, video])
}
