import { z } from 'zod'

export const ErrorCodeSchema = z.enum([
  'INVALID_PAYLOAD',
  'PAYLOAD_TOO_LARGE',
  'IA_TIMEOUT',
  'INFERENCE_ERROR',
  'RATE_LIMITED',
  'WEBSOCKET_DISCONNECTED',
])

export const ErrorResponseSchema = z.object({
  type: z.literal('error'),
  code: ErrorCodeSchema,
  message: z.string().min(1),
  timestamp: z.number().int().positive(),
})

export type ErrorCodeSchema = z.infer<typeof ErrorCodeSchema>
export type ErrorResponseSchema = z.infer<typeof ErrorResponseSchema>