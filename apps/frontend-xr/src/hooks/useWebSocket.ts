import { useEffect, useState } from 'react'
import { webSocketService } from '../services/websocket.service'

type WSState = 'CONNECTING' | 'OPEN' | 'CLOSED'

export function useWebSocket() {
  const [wsState, setWsState] = useState<WSState>('CONNECTING')

  useEffect(() => {
    webSocketService.onStateChange(setWsState)
    webSocketService.connect()

    return () => {
      webSocketService.offStateChange(setWsState)
    }
  }, [])

  return { wsState }
}
