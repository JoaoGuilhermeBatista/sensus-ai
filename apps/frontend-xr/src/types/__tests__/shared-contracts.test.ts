import { describe, it, expect } from 'vitest'
import {
  DetectedObjectSchema,
  DistanceSchema,
  AnalysisResponseSchema,
  FramePayloadSchema,
  HeartbeatPayloadSchema,
  ErrorCodeSchema,
  ErrorResponseSchema,
} from '@sensus/shared-contracts'

// ─── DistanceSchema ──────────────────────────────────────────────────────────

describe('DistanceSchema', () => {
  it('accepts perto', () => expect(DistanceSchema.parse('perto')).toBe('perto'))
  it('accepts medio', () => expect(DistanceSchema.parse('medio')).toBe('medio'))
  it('accepts longe', () => expect(DistanceSchema.parse('longe')).toBe('longe'))
  it('rejects unknown distance', () => {
    expect(() => DistanceSchema.parse('very_far')).toThrow()
  })
})

// ─── DetectedObjectSchema ────────────────────────────────────────────────────

describe('DetectedObjectSchema', () => {
  const valid = {
    name: 'person',
    confidence: 0.92,
    x: 0.1,
    y: 0.2,
    width: 0.3,
    height: 0.4,
    distance: 'perto' as const,
    isClose: true,
  }

  it('parses a valid DetectedObject', () => {
    expect(DetectedObjectSchema.parse(valid)).toMatchObject(valid)
  })

  it('rejects confidence > 1', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, confidence: 1.5 })).toThrow()
  })

  it('rejects confidence < 0', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, confidence: -0.1 })).toThrow()
  })

  it('rejects x outside [0, 1]', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, x: 1.1 })).toThrow()
  })

  it('rejects y outside [0, 1]', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, y: -0.01 })).toThrow()
  })

  it('rejects width outside [0, 1]', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, width: 2.0 })).toThrow()
  })

  it('rejects height outside [0, 1]', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, height: 1.5 })).toThrow()
  })

  it('rejects invalid distance value', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, distance: 'close' })).toThrow()
  })

  it('rejects empty name', () => {
    expect(() => DetectedObjectSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('chair at medio distance parses correctly', () => {
    const chair = { ...valid, name: 'chair', distance: 'medio' as const, isClose: false }
    expect(DetectedObjectSchema.parse(chair).name).toBe('chair')
  })

  it('dining table at longe distance parses correctly', () => {
    const table = { ...valid, name: 'dining table', distance: 'longe' as const, isClose: false }
    expect(DetectedObjectSchema.parse(table).isClose).toBe(false)
  })

  it('cell phone parses correctly', () => {
    const phone = { ...valid, name: 'cell phone', confidence: 0.75 }
    expect(DetectedObjectSchema.parse(phone).name).toBe('cell phone')
  })
})

// ─── AnalysisResponseSchema ──────────────────────────────────────────────────

describe('AnalysisResponseSchema', () => {
  const validObj = {
    name: 'person', confidence: 0.9, x: 0.1, y: 0.1,
    width: 0.2, height: 0.5, distance: 'perto' as const, isClose: true,
  }
  const valid = {
    type: 'analysis' as const,
    frameId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: 1700000000000,
    latencyMs: 120,
    objects: [validObj],
  }

  it('parses a valid AnalysisResponse', () => {
    expect(AnalysisResponseSchema.parse(valid).type).toBe('analysis')
  })

  it('rejects wrong type field', () => {
    expect(() => AnalysisResponseSchema.parse({ ...valid, type: 'frame' })).toThrow()
  })

  it('rejects invalid UUID as frameId', () => {
    expect(() => AnalysisResponseSchema.parse({ ...valid, frameId: 'not-a-uuid' })).toThrow()
  })

  it('rejects negative latencyMs', () => {
    expect(() => AnalysisResponseSchema.parse({ ...valid, latencyMs: -1 })).toThrow()
  })

  it('accepts empty objects array', () => {
    expect(AnalysisResponseSchema.parse({ ...valid, objects: [] }).objects).toHaveLength(0)
  })
})

// ─── FramePayloadSchema ───────────────────────────────────────────────────────

describe('FramePayloadSchema', () => {
  const valid = {
    type: 'frame' as const,
    frameId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: 1700000000000,
    encoding: 'jpeg' as const,
    data: 'base64data==',
  }

  it('parses a valid FramePayload', () => {
    expect(FramePayloadSchema.parse(valid).type).toBe('frame')
  })

  it('rejects type other than frame', () => {
    expect(() => FramePayloadSchema.parse({ ...valid, type: 'heartbeat' })).toThrow()
  })

  it('rejects empty data', () => {
    expect(() => FramePayloadSchema.parse({ ...valid, data: '' })).toThrow()
  })
})

// ─── HeartbeatPayloadSchema ───────────────────────────────────────────────────

describe('HeartbeatPayloadSchema', () => {
  it('parses a valid heartbeat', () => {
    const result = HeartbeatPayloadSchema.parse({ type: 'heartbeat', timestamp: 1700000000 })
    expect(result.type).toBe('heartbeat')
  })

  it('rejects wrong type', () => {
    expect(() => HeartbeatPayloadSchema.parse({ type: 'frame', timestamp: 1700000000 })).toThrow()
  })
})

// ─── ErrorCodeSchema ──────────────────────────────────────────────────────────

describe('ErrorCodeSchema', () => {
  const codes = [
    'INVALID_PAYLOAD', 'PAYLOAD_TOO_LARGE', 'IA_TIMEOUT',
    'INFERENCE_ERROR', 'RATE_LIMITED', 'WEBSOCKET_DISCONNECTED',
  ]
  codes.forEach(code => {
    it(`accepts error code ${code}`, () => {
      expect(ErrorCodeSchema.parse(code)).toBe(code)
    })
  })

  it('rejects unknown error code', () => {
    expect(() => ErrorCodeSchema.parse('UNKNOWN_CODE')).toThrow()
  })
})

// ─── ErrorResponseSchema ──────────────────────────────────────────────────────

describe('ErrorResponseSchema', () => {
  const valid = {
    type: 'error' as const,
    code: 'INFERENCE_ERROR' as const,
    message: 'Inference pipeline failed',
    timestamp: 1700000000,
  }

  it('parses a valid ErrorResponse', () => {
    expect(ErrorResponseSchema.parse(valid).code).toBe('INFERENCE_ERROR')
  })

  it('rejects invalid error code', () => {
    expect(() => ErrorResponseSchema.parse({ ...valid, code: 'BAD_CODE' })).toThrow()
  })

  it('rejects wrong type', () => {
    expect(() => ErrorResponseSchema.parse({ ...valid, type: 'analysis' })).toThrow()
  })
})
