// Resolve a URL do WebSocket. Se VITE_BACKEND_WS_URL for um caminho relativo
// (ex.: "/ws/realtime"), monta ws/wss contra a origem atual — assim funciona tanto
// no desktop (http) quanto via HTTPS por IP no Quest (wss, passando pelo proxy do Vite).
function resolveWsUrl(): string {
  const env = import.meta.env.VITE_BACKEND_WS_URL as string | undefined
  if (env && /^wss?:\/\//i.test(env)) return env // URL absoluta explícita
  const path = env && env.startsWith('/') ? env : '/ws/realtime'
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}${path}`
  }
  return `ws://localhost:8080${path}`
}

export const config = {
  WS_URL: resolveWsUrl(),
  FPS: 3,
  WIDTH: 640,
  HEIGHT: 480,
  QUALITY: 0.8,
}
