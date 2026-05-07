export interface WebSocketPayload {
  tipo: 'imagem'
  dados: string
  sessionId?: string
}

export interface WebSocketError {
  erro: string
}
