type WSState = 'CONNECTING' | 'OPEN' | 'CLOSED'

interface StatusIndicatorProps {
  wsState: WSState
}

const CONFIG: Record<WSState, { label: string; color: string; pulse: boolean }> = {
  OPEN:       { label: 'Conectado',    color: 'var(--ok)',     pulse: true  },
  CONNECTING: { label: 'Conectando…',  color: 'var(--accent)', pulse: true  },
  CLOSED:     { label: 'Desconectado', color: 'var(--danger)', pulse: false },
}

export function StatusIndicator({ wsState }: StatusIndicatorProps) {
  const cfg = CONFIG[wsState]

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 50,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 13px',
      borderRadius: 8,
      background: 'oklch(0.16 0.008 70 / 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid oklch(0.96 0.005 80 / 0.08)',
      fontFamily: "'Geist Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.04em',
      color: 'var(--fg)',
      userSelect: 'none',
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: cfg.pulse
          ? `0 0 0 3px color-mix(in oklab, ${cfg.color} 25%, transparent)`
          : 'none',
      }} />
      {cfg.label}
    </div>
  )
}
