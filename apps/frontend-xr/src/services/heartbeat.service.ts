// SDD 05: send heartbeat every 15 seconds; connections may close after 60s idle.
const HEARTBEAT_INTERVAL_MS = 15_000

export type SendFn = (payload: string) => void

export class HeartbeatService {
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly sendFn: SendFn

  constructor(sendFn: SendFn) {
    this.sendFn = sendFn
  }

  start(): void {
    if (this.timer !== null) return
    this.timer = setInterval(() => {
      this.sendFn(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
    }, HEARTBEAT_INTERVAL_MS)
  }

  stop(): void {
    if (this.timer === null) return
    clearInterval(this.timer)
    this.timer = null
  }

  get running(): boolean {
    return this.timer !== null
  }
}
