import { z } from 'zod'

export const FramePayloadSchema = z.object({
  type: z.literal('frame'),
  frameId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  encoding: z.literal('jpeg'),
  data: z.string().min(1),
})

export const HeartbeatPayloadSchema = z.object({
  type: z.literal('heartbeat'),
  timestamp: z.number().int().positive(),
})

export const FrontendMessageSchema = z.discriminatedUnion('type', [
  FramePayloadSchema,
  HeartbeatPayloadSchema,
])

export type FramePayloadSchema = z.infer<typeof FramePayloadSchema>
export type HeartbeatPayloadSchema = z.infer<typeof HeartbeatPayloadSchema>
export type FrontendMessageSchema = z.infer<typeof FrontendMessageSchema>