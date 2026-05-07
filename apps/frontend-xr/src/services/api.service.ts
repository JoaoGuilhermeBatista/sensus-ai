import type {
  AnaliseResponse,
  AnaliseResponseEnvelope,
  SpringPage,
} from '../types/AnaliseResponse'

const BASE_URL = 'http://localhost:8080'

class ApiService {
  async analisarImagem(imagemBase64: string, formato = 'jpeg'): Promise<AnaliseResponse> {
    const res = await fetch(`${BASE_URL}/api/analisar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagemBase64, formato }),
    })
    const json: AnaliseResponseEnvelope = await res.json()
    return json.dados
  }

  async listarAnalises(page = 0, size = 20): Promise<SpringPage<AnaliseResponse>> {
    const res = await fetch(`${BASE_URL}/api/analises?page=${page}&size=${size}`)
    return res.json()
  }

  async status(): Promise<{ backend: string; iaService: string; timestamp: number }> {
    const res = await fetch(`${BASE_URL}/api/status`)
    const json: AnaliseResponseEnvelope = await res.json()
    return json.dados as unknown as { backend: string; iaService: string; timestamp: number }
  }
}

export const apiService = new ApiService()
