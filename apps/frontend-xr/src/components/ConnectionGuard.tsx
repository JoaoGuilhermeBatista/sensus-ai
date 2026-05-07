import type { ReactNode } from 'react'

type WSState = 'CONNECTING' | 'OPEN' | 'CLOSED'

interface ConnectionGuardProps {
  wsState: WSState
  children: ReactNode
}

export function ConnectionGuard({ wsState, children }: ConnectionGuardProps) {
  if (wsState === 'CLOSED') {
    return (
      <div className="connection-guard">
        <p>Backend desconectado. Tentando reconectar...</p>
      </div>
    )
  }
  return <>{children}</>
}
