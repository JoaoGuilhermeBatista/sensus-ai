import { useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera'

interface CameraViewProps {
  onVideoReady?: (video: HTMLVideoElement) => void
  /** Keep stream alive for frame capture but don't show video — used in WebXR passthrough mode */
  hidden?: boolean
}

export function CameraView({ onVideoReady, hidden = false }: CameraViewProps) {
  const { videoRef, state } = useCamera()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state === 'ready' && videoRef.current && containerRef.current) {
      containerRef.current.appendChild(videoRef.current)
      onVideoReady?.(videoRef.current)
    }
  }, [state, videoRef, onVideoReady])

  if (hidden) {
    // Invisible but mounted — stream stays alive for useFrameSender capture
    return <div ref={containerRef} style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: 1, height: 1 }} />
  }

  if (state === 'denied') return <p className="camera-error">Permissão de câmera negada.</p>
  if (state === 'error') return <p className="camera-error">Erro ao acessar câmera.</p>
  if (state === 'loading') return <p className="camera-loading">Iniciando câmera...</p>

  return <div ref={containerRef} className="camera-container" />
}
