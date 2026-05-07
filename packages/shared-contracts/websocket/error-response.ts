import type { AnalysisResponse } from './analysis-response'

export type ErrorCode =
  | 'INVALID_PAYLOAD'
  | 'PAYLOAD_TOO_LARGE'
  | 'IA_TIMEOUT'
  | 'INFERENCE_ERROR'
  | 'RATE_LIMITED'
  | 'WEBSOCKET_DISCONNECTED'

export type ErrorResponse = {
  type: 'error'
  code: ErrorCode
  message: string
  timestamp: number
}

export type BackendMessage = AnalysisResponse | ErrorResponse