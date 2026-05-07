import { useCallback, useEffect, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { OverlayInfo } from '../components/OverlayInfo'
import { StatusIndicator } from '../components/StatusIndicator'
import { ConnectionGuard } from '../components/ConnectionGuard'
import { useWebSocket } from '../hooks/useWebSocket'
import { useFrameSender } from '../hooks/useFrameSender'
import { webSocketService } from '../services/websocket.service'
import type { AnaliseResponse } from '../types/AnaliseResponse'
import type { WebSocketError } from '../types/WebSocketPayload'
import '../styles/globals.css'

function isAnaliseResponse(data: unknown): data is AnaliseResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'objetos' in data &&
    Array.isArray((data as AnaliseResponse).objetos)
  )
}

function isWebSocketError(data: unknown): data is WebSocketError {
  return typeof data === 'object' && data !== null && 'erro' in data
}

export function App() {
  const { wsState } = useWebSocket()
  const [analise, setAnalise] = useState<AnaliseResponse | null>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)

  useFrameSender(video, wsState === 'OPEN')

  useEffect(() => {
    const handler = (data: unknown) => {
      if (isWebSocketError(data)) {
        console.warn('[WS] backend error:', data.erro)
        return
      }
      if (isAnaliseResponse(data)) {
        console.log(`[WS] response objetos=${data.objetos.length}`)
        console.log('[UI] updated')
        setAnalise(data)
      }
    }

    webSocketService.onMessage(handler)
    return () => webSocketService.offMessage(handler)
  }, [])

  const handleVideoReady = useCallback((v: HTMLVideoElement) => {
    setVideo(v)
  }, [])

  return (
    <>
      <StatusIndicator wsState={wsState} />
      <ConnectionGuard wsState={wsState}>
        <CameraView onVideoReady={handleVideoReady} />
        <OverlayInfo analise={analise} />
      </ConnectionGuard>
    </>
  )
}
