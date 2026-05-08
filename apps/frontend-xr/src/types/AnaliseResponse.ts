import type { ObjetoDetectado } from './ObjetoDetectado'

// SDD-compliant type — use this for new code and shared-contracts consumers.
export type { AnalysisResponse } from '@sensus/shared-contracts'

// Legacy shape sent by the current backend (/analisar endpoint, Portuguese fields).
// Will be replaced by AnalysisResponse once backend migrates to /infer (SDD 02/03).
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
