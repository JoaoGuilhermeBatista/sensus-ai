import { z } from 'zod'
import { DetectedObjectSchema } from './detection.schema'

export const AnalysisResponseSchema = z.object({
  type: z.literal('analysis'),
  frameId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  latencyMs: z.number().nonnegative(),
  objects: z.array(DetectedObjectSchema),
})

export type AnalysisResponseSchema = z.infer<typeof AnalysisResponseSchema>