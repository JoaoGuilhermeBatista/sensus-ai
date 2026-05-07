import type { AnaliseResponse } from '../types/AnaliseResponse'

interface OverlayInfoProps {
  analise: AnaliseResponse | null
}

const DISTANCIA_LABEL: Record<string, string> = {
  perto: 'perto',
  medio: 'médio',
  longe: 'longe',
}

export function OverlayInfo({ analise }: OverlayInfoProps) {
  if (!analise || analise.objetos.length === 0) return null

  return (
    <div className="overlay-info">
      {analise.objetos.map((obj, i) => (
        <p key={i} className={obj.isClose ? 'obj-close' : 'obj-normal'}>
          {obj.nome} — {DISTANCIA_LABEL[obj.distancia] ?? obj.distancia}
        </p>
      ))}
    </div>
  )
}
