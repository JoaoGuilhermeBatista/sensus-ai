import { useEffect, useRef, useState } from 'react'
import { cameraService } from '../services/camera.service'

type CameraState = 'idle' | 'loading' | 'ready' | 'denied' | 'error'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [state, setState] = useState<CameraState>('idle')

  useEffect(() => {
    setState('loading')

    cameraService
      .start()
      .then((video) => {
        videoRef.current = video
        setState('ready')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setState('denied')
        } else {
          setState('error')
        }
        console.error('[CAMERA]', err)
      })

    return () => {
      cameraService.stop()
    }
  }, [])

  return { videoRef, state }
}
