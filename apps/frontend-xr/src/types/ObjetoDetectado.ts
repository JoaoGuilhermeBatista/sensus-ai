// SDD-compliant type — use this for new code and shared-contracts consumers.
export type { DetectedObject } from '@sensus/shared-contracts'

// Legacy shape sent by the current backend (/analisar endpoint, Portuguese fields).
// This adapter type will be removed once the backend migrates to /infer (SDD 03).
export interface ObjetoDetectado {
  nome: string
  distancia: 'perto' | 'medio' | 'longe'
  isClose: boolean
  bboxX?: number
  bboxY?: number
  bboxWidth?: number
  bboxHeight?: number
  bbox_x?: number
  bbox_y?: number
  bbox_width?: number
  bbox_height?: number
}
