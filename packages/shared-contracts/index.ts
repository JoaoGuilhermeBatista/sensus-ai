export type { DetectedObject, Distance } from './types/detection'

export type {
  FrameEncoding,
  FramePayload,
  HeartbeatPayload,
  FrontendMessage,
} from './websocket/frame-payload'

export type { AnalysisResponse } from './websocket/analysis-response'

export type {
  ErrorCode,
  ErrorResponse,
  BackendMessage,
} from './websocket/error-response'

export {
  DistanceSchema,
  DetectedObjectSchema,
  FramePayloadSchema,
  HeartbeatPayloadSchema,
  FrontendMessageSchema,
  AnalysisResponseSchema,
  ErrorCodeSchema,
  ErrorResponseSchema,
  BackendMessageSchema,
} from './schemas'