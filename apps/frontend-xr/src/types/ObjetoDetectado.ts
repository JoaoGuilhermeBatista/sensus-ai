export interface ObjetoDetectado {
  nome: string
  distancia: 'perto' | 'medio' | 'longe'
  isClose: boolean
}
