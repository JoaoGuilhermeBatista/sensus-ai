type WSState = 'CONNECTING' | 'OPEN' | 'CLOSED'

interface StatusIndicatorProps {
  wsState: WSState
}

const LABEL: Record<WSState, string> = {
  CONNECTING: 'Conectando...',
  OPEN: 'Conectado',
  CLOSED: 'Desconectado',
}

export function StatusIndicator({ wsState }: StatusIndicatorProps) {
  return (
    <div className={`status-indicator status-${wsState.toLowerCase()}`}>
      {LABEL[wsState]}
    </div>
  )
}
