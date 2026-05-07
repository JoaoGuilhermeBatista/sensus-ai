import { z } from 'zod'
import { AnalysisResponseSchema } from './analysis-response.schema'
import { ErrorResponseSchema } from './error-response.schema'

export * from './detection.schema'
export * from './frame-payload.schema'
export * from './analysis-response.schema'
export * from './error-response.schema'

export const BackendMessageSchema = z.discriminatedUnion('type', [
  AnalysisResponseSchema,
  ErrorResponseSchema,
])

export type BackendMessageSchema = z.infer<typeof BackendMessageSchema>