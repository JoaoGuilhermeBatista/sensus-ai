import type { ObjetoDetectado } from './ObjetoDetectado'

export interface AnaliseResponse {
  id?: number
  timestamp: number
  objetos: ObjetoDetectado[]
}

export interface AnaliseResponseEnvelope {
  sucesso: boolean
  mensagem: string
  dados: AnaliseResponse
  timestamp: number
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
