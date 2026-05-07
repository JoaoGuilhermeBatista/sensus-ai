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