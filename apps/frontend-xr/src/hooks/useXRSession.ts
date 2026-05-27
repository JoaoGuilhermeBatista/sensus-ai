import { useCallback, useEffect, useRef, useState } from 'react'

export type XRSupport = 'checking' | 'supported' | 'unsupported'

export function useXRSession() {
  const sessionRef = useRef<XRSession | null>(null)
  const [active, setActive] = useState(false)
  const [support, setSupport] = useState<XRSupport>('checking')

  useEffect(() => {
    if (!navigator.xr) { setSupport('unsupported'); return }
    navigator.xr.isSessionSupported('immersive-ar')
      .then(ok => setSupport(ok ? 'supported' : 'unsupported'))
      .catch(() => setSupport('unsupported'))
  }, [])

  const enter = useCallback(async (overlayRoot: HTMLElement): Promise<boolean> => {
    if (!navigator.xr) return false
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['camera-access', 'dom-overlay'],
        domOverlay: { root: overlayRoot },
      })
      sessionRef.current = session
      setActive(true)
      session.addEventListener('end', () => {
        sessionRef.current = null
        setActive(false)
      })
      return true
    } catch (err) {
      console.warn('[XR] requestSession failed:', err)
      return false
    }
  }, [])

  const exit = useCallback(async () => {
    await sessionRef.current?.end().catch(() => {})
  }, [])

  return { active, support, enter, exit }
}

export function isMetaQuest(): boolean {
  return /OculusBrowser|Quest/i.test(navigator.userAgent)
}
