export type Distance = 'perto' | 'medio' | 'longe'

export type DetectedObject = {
  name: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
  distance: Distance
  isClose: boolean
}