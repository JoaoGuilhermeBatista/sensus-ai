import type { AnaliseResponse } from '../types/AnaliseResponse'
import type { ObjetoDetectado } from '../types/ObjetoDetectado'

interface OverlayInfoProps {
  analise: AnaliseResponse | null
}

const BUCKET: Record<string, string> = {
  pessoa: 'person', person: 'person',
  carro: 'vehicle', car: 'vehicle', moto: 'vehicle', motorcycle: 'vehicle',
  onibus: 'vehicle', bus: 'vehicle', caminhao: 'vehicle', truck: 'vehicle',
  bicicleta: 'vehicle', bicycle: 'vehicle', barco: 'vehicle', boat: 'vehicle',
  cadeira: 'furniture', chair: 'furniture', sofa: 'furniture', couch: 'furniture',
  cama: 'furniture', bed: 'furniture', mesa: 'furniture',
  tv: 'electronic', laptop: 'electronic', notebook: 'electronic',
  mouse: 'electronic', teclado: 'electronic', keyboard: 'electronic',
  celular: 'electronic', remote: 'electronic', controle: 'electronic',
  banana: 'food', apple: 'food', pizza: 'food', sandwich: 'food', orange: 'food',
}

const CAT_COLOR: Record<string, string> = {
  person:     'var(--info)',
  vehicle:    'var(--danger)',
  furniture:  'var(--accent)',
  electronic: 'var(--info)',
  food:       'var(--ok)',
  default:    'var(--accent)',
}

const DIST_LABEL: Record<string, string> = {
  perto: 'PERTO',
  medio: 'MEDIO',
  longe: 'LONGE',
}

function colorOf(nome: string): string {
  const bucket = BUCKET[nome.toLowerCase()] ?? 'default'
  return CAT_COLOR[bucket] ?? CAT_COLOR.default
}

function DistanceBadge({ distancia, isClose }: Pick<ObjetoDetectado, 'distancia' | 'isClose'>) {
  const color = isClose ? 'var(--danger)' : 'var(--fg-3)'
  return (
    <span style={{
      fontFamily: "'Geist Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.05em',
      color,
      padding: '2px 6px',
      borderRadius: 4,
      background: isClose ? 'oklch(0.70 0.18 25 / 0.15)' : 'oklch(0.96 0.005 80 / 0.06)',
      border: isClose ? '1px solid oklch(0.70 0.18 25 / 0.3)' : '1px solid transparent',
    }}>
      {DIST_LABEL[distancia] ?? distancia}
    </span>
  )
}

export function OverlayInfo({ analise }: OverlayInfoProps) {
  if (!analise || analise.objetos.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 16,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      maxHeight: '60vh',
      overflowY: 'auto',
    }}>
      {analise.objetos.map((obj, i) => {
        const color = colorOf(obj.nome)
        return (
          <div key={i} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 12px',
            borderRadius: 8,
            background: 'oklch(0.16 0.008 70 / 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid ' + color + '33',
            boxShadow: obj.isClose ? '0 0 0 1px ' + color + '55' : 'none',
          }}>
            <span style={{
              width: 3,
              height: 20,
              borderRadius: 2,
              background: color,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--fg)',
              textTransform: 'capitalize',
            }}>
              {obj.nome}
            </span>
            <DistanceBadge distancia={obj.distancia} isClose={obj.isClose} />
          </div>
        )
      })}
    </div>
  )
}
