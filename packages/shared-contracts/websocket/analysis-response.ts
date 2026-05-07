import type { DetectedObject } from '../types/detection'

export type AnalysisResponse = {
  type: 'analysis'
  frameId: string
  timestamp: number
  latencyMs: number
  objects: DetectedObject[]
}