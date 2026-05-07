import { z } from 'zod'

export const DistanceSchema = z.enum(['perto', 'medio', 'longe'])

export const DetectedObjectSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  distance: DistanceSchema,
  isClose: z.boolean(),
})

export type DetectedObjectSchema = z.infer<typeof DetectedObjectSchema>