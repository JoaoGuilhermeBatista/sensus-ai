import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HeartbeatService } from '../heartbeat.service'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

describe('HeartbeatService — lifecycle', () => {
  it('is not running before start()', () => {
    const svc = new HeartbeatService(vi.fn())
    expect(svc.running).toBe(false)
  })

  it('is running after start()', () => {
    const svc = new HeartbeatService(vi.fn())
    svc.start()
    expect(svc.running).toBe(true)
    svc.stop()
  })

  it('is not running after stop()', () => {
    const svc = new HeartbeatService(vi.fn())
    svc.start()
    svc.stop()
    expect(svc.running).toBe(false)
  })

  it('calling start() twice is idempotent', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()
    svc.start()

    vi.advanceTimersByTime(15_000)
    // Should only fire once — not twice due to double-start
    expect(send).toHaveBeenCalledTimes(1)
    svc.stop()
  })

  it('calling stop() when not running is safe', () => {
    const svc = new HeartbeatService(vi.fn())
    expect(() => svc.stop()).not.toThrow()
  })
})

// ─── Heartbeat payload ────────────────────────────────────────────────────────

describe('HeartbeatService — payload format', () => {
  it('sends JSON with type=heartbeat after 15 seconds', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(15_000)

    expect(send).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(send.mock.calls[0][0])
    expect(payload.type).toBe('heartbeat')
    svc.stop()
  })

  it('includes a numeric timestamp in the payload', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(15_000)

    const payload = JSON.parse(send.mock.calls[0][0])
    expect(typeof payload.timestamp).toBe('number')
    expect(payload.timestamp).toBeGreaterThan(0)
    svc.stop()
  })

  it('does NOT send before 15 seconds', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(14_999)

    expect(send).not.toHaveBeenCalled()
    svc.stop()
  })

  it('sends exactly once at 15 seconds, not before', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(15_000)
    expect(send).toHaveBeenCalledTimes(1)
    svc.stop()
  })

  it('sends again at 30 seconds (second interval)', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(30_000)
    expect(send).toHaveBeenCalledTimes(2)
    svc.stop()
  })

  it('sends three times at 45 seconds', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(45_000)
    expect(send).toHaveBeenCalledTimes(3)
    svc.stop()
  })

  it('stops sending after stop()', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)
    svc.start()

    vi.advanceTimersByTime(15_000)
    expect(send).toHaveBeenCalledTimes(1)

    svc.stop()
    vi.advanceTimersByTime(15_000)
    expect(send).toHaveBeenCalledTimes(1) // no additional calls
  })

  it('can be restarted after stop()', () => {
    const send = vi.fn()
    const svc = new HeartbeatService(send)

    svc.start()
    vi.advanceTimersByTime(15_000)
    svc.stop()

    svc.start()
    vi.advanceTimersByTime(15_000)
    expect(send).toHaveBeenCalledTimes(2)
    svc.stop()
  })
})