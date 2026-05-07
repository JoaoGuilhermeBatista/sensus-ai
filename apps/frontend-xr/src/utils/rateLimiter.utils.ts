export class RateLimiter {
  private lastSent = 0
  private readonly interval: number

  constructor(fps: number) {
    this.interval = 1000 / fps
  }

  canSend(): boolean {
    const now = Date.now()
    if (now - this.lastSent >= this.interval) {
      this.lastSent = now
      return true
    }
    return false
  }
}
