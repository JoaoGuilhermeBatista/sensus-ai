import { config } from '../config/app.config'
import { HeartbeatService } from './heartbeat.service'

type MessageCallback = (data: unknown) => void
type StateCallback = (state: 'CONNECTING' | 'OPEN' | 'CLOSED') => void

class WebSocketService {
  private socket: WebSocket | null = null
  private messageCallbacks: MessageCallback[] = []
  private stateCallbacks: StateCallback[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeat: HeartbeatService = new HeartbeatService((payload) => this.send(payload))

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return

    console.log('[WS] connecting...')
    this.notifyState('CONNECTING')
    this.socket = new WebSocket(config.WS_URL)

    this.socket.onopen = () => {
      console.log('[WS] connected')
      this.notifyState('OPEN')
      this.heartbeat.start()
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string)
        this.messageCallbacks.forEach((cb) => cb(data))
      } catch {
        console.warn('[WS] invalid JSON received')
      }
    }

    this.socket.onclose = () => {
      console.warn('[WS] closed, reconnecting in 2s...')
      this.heartbeat.stop()
      this.notifyState('CLOSED')
      this.scheduleReconnect()
    }

    this.socket.onerror = (err) => {
      console.error('[WS] error', err)
    }
  }

  send(data: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data)
    }
  }

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback)
  }

  offMessage(callback: MessageCallback): void {
    this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback)
  }

  onStateChange(callback: StateCallback): void {
    this.stateCallbacks.push(callback)
  }

  offStateChange(callback: StateCallback): void {
    this.stateCallbacks = this.stateCallbacks.filter((cb) => cb !== callback)
  }

  disconnect(): void {
    this.heartbeat.stop()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, 2000)
  }

  private notifyState(state: 'CONNECTING' | 'OPEN' | 'CLOSED'): void {
    this.stateCallbacks.forEach((cb) => cb(state))
  }
}

export const webSocketService = new WebSocketService()
