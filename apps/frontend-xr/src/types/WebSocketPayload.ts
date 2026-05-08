// Re-export SDD-compliant types from shared-contracts — canonical source of truth.
// Do NOT duplicate these definitions locally.
export type {
  FrameEncoding,
  FramePayload,
  HeartbeatPayload,
  FrontendMessage,
  ErrorCode,
  ErrorResponse,
  BackendMessage,
} from '@sensus/shared-contracts'

// Legacy error shape sent by the current backend (pre-SDD migration).
// Remove once the backend aligns with ErrorResponse from shared-contracts.
export interface WebSocketError {
  erro: string
}
