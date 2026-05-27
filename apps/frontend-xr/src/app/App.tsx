import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { StatusIndicator } from '../components/StatusIndicator'
import { ConnectionGuard } from '../components/ConnectionGuard'
import { useWebSocket } from '../hooks/useWebSocket'
import { useFrameSender } from '../hooks/useFrameSender'
import { useAudioAnnouncer } from '../hooks/useAudioAnnouncer'
import { XRScene } from '../components/XRScene'
import { startSession } from '@react-three/xr'
import { isMetaQuest } from '../hooks/useXRSession'
import { webSocketService } from '../services/websocket.service'
import type { AnaliseResponse } from '../types/AnaliseResponse'
import type { ObjetoDetectado } from '../types/ObjetoDetectado'
import type { WebSocketError } from '../types/WebSocketPayload'
import '../styles/globals.css'

function isAnaliseResponse(data: unknown): data is AnaliseResponse {
  return typeof data === 'object' && data !== null && 'objetos' in data && Array.isArray((data as any).objetos)
}
function isWebSocketError(data: unknown): data is WebSocketError {
  return typeof data === 'object' && data !== null && 'erro' in data
}

const ptLabel: Record<string, string> = {
  person: 'pessoa', bicycle: 'bicicleta', car: 'carro', motorcycle: 'moto',
  bus: 'onibus', train: 'trem', truck: 'caminhao', boat: 'barco',
  bench: 'banco', cat: 'gato', dog: 'cachorro', backpack: 'mochila',
  bottle: 'garrafa', cup: 'xicara', fork: 'garfo', knife: 'faca',
  banana: 'banana', apple: 'maca', sandwich: 'sanduiche', orange: 'laranja',
  pizza: 'pizza', donut: 'rosquinha', cake: 'bolo', chair: 'cadeira',
  couch: 'sofa', bed: 'cama', toilet: 'vaso', tv: 'tv',
  laptop: 'notebook', mouse: 'mouse', remote: 'controle', keyboard: 'teclado',
  'cell phone': 'celular', sink: 'pia', refrigerator: 'geladeira',
  book: 'livro', clock: 'relogio', scissors: 'tesoura', toothbrush: 'escova',
}
const ptOf = (l: string) => ptLabel[l.toLowerCase()] || l

// Cor única por classe — cores fixas para as mais comuns, hash determinístico para o resto.
const CLASS_COLOR: Record<string, string> = {
  pessoa: '#3b82f6', garrafa: '#f59e0b', copo: '#eab308', tigela: '#f97316',
  cadeira: '#22c55e', sofá: '#16a34a', cama: '#15803d', mesa: '#84cc16',
  banco: '#65a30d', 'vaso de planta': '#10b981',
  televisão: '#a855f7', notebook: '#8b5cf6', celular: '#d946ef',
  'micro-ondas': '#7c3aed', forno: '#6d28d9', geladeira: '#9333ea',
  livro: '#ec4899', relógio: '#f43f5e', pia: '#06b6d4',
  mochila: '#ef4444', bolsa: '#dc2626', mala: '#b91c1c', 'guarda-chuva': '#0ea5e9',
  carro: '#e11d48', moto: '#be123c', bicicleta: '#fb7185',
  ônibus: '#9f1239', caminhão: '#881337',
  gato: '#fbbf24', cachorro: '#fb923c',
  semáforo: '#facc15', 'placa de pare': '#ef4444', 'vaso sanitário': '#0891b2',
}
function colorOf(nome: string) {
  const key = nome.toLowerCase()
  if (CLASS_COLOR[key]) return CLASS_COLOR[key]
  // hash estável -> hue, para classes sem cor fixa
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
  return `hsl(${h}, 70%, 55%)`
}

const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, setV]
}
const Icon = ({ d, size = 16, stroke = 1.6 }: { d: any; size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const ICONS = {
  live: <><circle cx="12" cy="12" r="3"/><path d="M5.05 5.05a10 10 0 0 0 0 13.9M18.95 5.05a10 10 0 0 1 0 13.9M8.46 8.46a5 5 0 0 0 0 7.07M15.54 8.46a5 5 0 0 1 0 7.07"/></>,
  sessions: <><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></>,
  gallery: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="9" cy="9" r="1.5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  xr: <><path d="M2 12h4l2-4h8l2 4h4v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  stop: <><rect x="5" y="5" width="14" height="14" rx="1"/></>,
  shot: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  expand: <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>,
}

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="0.8"/>
      <circle cx="12" cy="12" r="2.2" fill="var(--accent)"/>
      <line x1="12" y1="0.5" x2="12" y2="3" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="12" y1="21" x2="12" y2="23.5" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="0.5" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="21" y1="12" x2="23.5" y2="12" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  )
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--line)', background: 'transparent',
  color: 'var(--fg)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}

function getBbox(obj: ObjetoDetectado) {
  return {
    x: obj.bboxX ?? (obj as any).bbox_x,
    y: obj.bboxY ?? (obj as any).bbox_y,
    w: obj.bboxWidth ?? (obj as any).bbox_width,
    h: obj.bboxHeight ?? (obj as any).bbox_height,
  }
}

// Hitbox suavizada: carrega contador de "frames sem confirmação" para não piscar.
type SmoothBox = ObjetoDetectado & { _miss?: number }

// Casa cada hitbox com o alvo mais próximo da mesma classe e interpola posição/
// tamanho. Caixas sem alvo no frame atual persistem por alguns frames (anti-flicker)
// e só são descartadas após MAX_MISS frames consecutivos sem confirmação.
function matchAndLerp(
  current: SmoothBox[],
  target: ObjetoDetectado[],
  t: number,
): SmoothBox[] {
  const MAX_MISS = 12 // ~0.2s a 60fps antes de sumir
  const used = new Set<number>()
  const result: SmoothBox[] = []
  const lerp = (a: number, b: number) => a + (b - a) * t

  // 1) para cada alvo da IA, casa com a caixa atual mais próxima
  for (const tgt of target) {
    const tb = getBbox(tgt)
    if (tb.x == null) continue
    let best = -1, bestDist = Infinity
    current.forEach((cur, i) => {
      if (used.has(i) || cur.nome !== tgt.nome) return
      const cb = getBbox(cur)
      if (cb.x == null) return
      const d = Math.hypot(cb.x! - tb.x!, cb.y! - tb.y!)
      if (d < bestDist) { bestDist = d; best = i }
    })

    if (best >= 0 && bestDist < 0.3) {
      used.add(best)
      const cb = getBbox(current[best])
      result.push({
        ...tgt, _miss: 0,
        bboxX: lerp(cb.x!, tb.x!),
        bboxY: lerp(cb.y!, tb.y!),
        bboxWidth: lerp(cb.w!, tb.w!),
        bboxHeight: lerp(cb.h!, tb.h!),
      })
    } else {
      result.push({ ...tgt, _miss: 0 }) // objeto novo
    }
  }

  // 2) caixas atuais sem alvo neste frame: mantém por mais alguns frames
  current.forEach((cur, i) => {
    if (used.has(i)) return
    const miss = (cur._miss ?? 0) + 1
    if (miss <= MAX_MISS) result.push({ ...cur, _miss: miss })
  })

  return result
}

function drawBboxes(
  canvas: HTMLCanvasElement,
  objetos: ObjetoDetectado[],
  showLabels: boolean,
  video?: HTMLVideoElement | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const cw = canvas.clientWidth, ch = canvas.clientHeight
  if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
    canvas.width = cw * dpr; canvas.height = ch * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  // The video uses object-fit:contain so there may be letterbox/pillarbox bars.
  // Compute the active video area inside the canvas so bbox coords map correctly.
  const vw = video?.videoWidth || cw, vh = video?.videoHeight || ch
  const scale = Math.min(cw / vw, ch / vh)
  const activeW = vw * scale, activeH = vh * scale
  const offsetX = (cw - activeW) / 2, offsetY = (ch - activeH) / 2

  objetos.forEach(obj => {
    const { x, y, w, h } = getBbox(obj)
    if (x == null || y == null || w == null || h == null) return

    // Hitbox acompanha o tamanho real do bbox detectado (coords normalizadas 0-1)
    const rx = offsetX + x * activeW
    const ry = offsetY + y * activeH
    const rw = w * activeW
    const rh = h * activeH

    const color = colorOf(obj.nome)
    const t = Math.min(10, rw / 3, rh / 3)
    ctx.strokeStyle = color; ctx.lineWidth = 1.5
    ctx.strokeRect(rx, ry, rw, rh)
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(rx, ry + t); ctx.lineTo(rx, ry); ctx.lineTo(rx + t, ry)
    ctx.moveTo(rx + rw - t, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + t)
    ctx.moveTo(rx, ry + rh - t); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + t, ry + rh)
    ctx.moveTo(rx + rw - t, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - t)
    ctx.stroke()
    if (showLabels) {
      const label = ptOf(obj.nome)
      ctx.font = "500 11px 'Geist Mono', monospace"
      const tw = ctx.measureText(label).width
      ctx.fillStyle = color
      ctx.fillRect(rx - 0.75, ry - 18, tw + 12, 18)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, rx + 5, ry - 5)
    }
  })
}
function Sidebar({ view, setView, onXR, sessions, wsState }: any) {
  const items = [
    { id: 'live', label: 'Live', icon: ICONS.live, hint: 'tempo real' },
    { id: 'sessions', label: 'Sessoes', icon: ICONS.sessions, hint: `${sessions.length} salvas` },
    { id: 'gallery', label: 'Galeria', icon: ICONS.gallery, hint: 'snapshots' },
    { id: 'settings', label: 'Configuracoes', icon: ICONS.settings, hint: 'ajustes' },
  ]
  return (
    <aside style={{
      borderRight: '1px solid var(--line)', background: 'var(--bg-2)',
      display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: 8, width: 232, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 16px' }}>
        <Mark size={22}/>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>Sensus</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>v0.4 - BETA</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setView(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '9px 10px', borderRadius: 8, border: 'none',
            background: view === it.id ? 'var(--bg-3)' : 'transparent',
            color: view === it.id ? 'var(--fg)' : 'var(--fg-2)',
            textAlign: 'left', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ color: view === it.id ? 'var(--accent)' : 'var(--fg-3)' }}>
              <Icon d={it.icon} size={16}/>
            </span>
            <span style={{ flex: 1 }}>{it.label}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--fg-3)' }}>{it.hint}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 1, background: 'var(--line-2)', margin: '12px 8px' }}/>
      <button onClick={onXR} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderRadius: 8,
        border: '1px solid var(--line)', background: 'transparent',
        color: 'var(--fg)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent)' }}><Icon d={ICONS.xr} size={16}/></span>
          Modo XR
        </span>
        <span style={{ color: 'var(--fg-3)' }}><Icon d={ICONS.expand} size={12}/></span>
      </button>
      <div style={{ marginTop: 'auto' }}>
        <div style={{
          padding: 12, borderRadius: 8, background: 'var(--bg-3)',
          border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>BACKEND</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: wsState === 'OPEN' ? 'var(--ok)' : wsState === 'CONNECTING' ? 'var(--accent)' : 'var(--danger)',
              boxShadow: wsState === 'OPEN' ? '0 0 0 3px color-mix(in oklab, var(--ok) 25%, transparent)' : 'none',
            }}/>
            {wsState === 'OPEN' ? 'conectado' : wsState === 'CONNECTING' ? 'conectando...' : 'desconectado'}
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--fg-3)' }}>YOLOv8 - Spring</div>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ view }: { view: string }) {
  const titles: Record<string, [string, string]> = {
    live: ['Captura ao vivo', 'feed da camera + inferencia em tempo real'],
    sessions: ['Sessoes', 'historico de analises'],
    gallery: ['Galeria', 'snapshots capturados'],
    settings: ['Configuracoes', 'modelo, sensibilidade e narracao'],
  }
  const [title, sub] = titles[view] ?? titles.live
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: '1px solid var(--line)', background: 'var(--bg)',
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}

function Empty({ msg, sub }: { msg: string; sub: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '40px 20px', textAlign: 'center', color: 'var(--fg-3)',
    }}>
      <div style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>{msg}</div>
      <div style={{ fontSize: 12 }}>{sub}</div>
    </div>
  )
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{
      padding: '80px 20px', textAlign: 'center',
      border: '1px dashed var(--line)', borderRadius: 14, background: 'var(--bg-2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--fg)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', maxWidth: 380 }}>{sub}</div>
    </div>
  )
}
function Inspector({ analise, history, wsState }: { analise: AnaliseResponse | null; history: any[]; wsState: string }) {
  const [tab, setTab] = useState('now')
  const objetos = analise?.objetos ?? []
  const grouped = Object.entries(
    objetos.reduce((acc: any, o) => { acc[o.nome] = (acc[o.nome] || 0) + 1; return acc }, {})
  ).sort((a: any, b: any) => b[1] - a[1])

  return (
    <aside style={{
      width: 340, flexShrink: 0, borderLeft: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', minHeight: 0,
    }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-2)' }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: wsState === 'OPEN' ? 'var(--ok)' : 'var(--fg-3)',
          boxShadow: wsState === 'OPEN' ? '0 0 0 3px color-mix(in oklab, var(--ok) 25%, transparent)' : 'none',
        }}/>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11.5, color: 'var(--fg-2)' }}>
          {wsState === 'OPEN' ? `${objetos.length} objeto(s) detectado(s)` : 'Aguardando conexao...'}
        </span>
      </div>
      <div style={{ display: 'flex', padding: '10px 14px 0', gap: 4 }}>
        {([['now', 'Agora', objetos.length], ['history', 'Historico', history.length]] as any[]).map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 12px', borderRadius: 6,
            background: tab === id ? 'var(--bg-3)' : 'transparent',
            color: tab === id ? 'var(--fg)' : 'var(--fg-3)',
            border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {label}
            <span style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10, padding: '1px 5px', borderRadius: 3,
              background: tab === id ? 'var(--bg-4)' : 'var(--bg-3)', color: 'var(--fg-3)',
            }}>{count}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 18px 18px' }}>
        {tab === 'now' && (
          objetos.length === 0
            ? <Empty msg="Nenhum objeto detectado" sub="Aguardando deteccoes do backend." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.1em', marginBottom: 8 }}>RESUMO</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {grouped.map(([label, count]: any) => (
                      <span key={label} style={{
                        fontSize: 11.5, padding: '4px 9px', borderRadius: 100,
                        border: `1px solid ${colorOf(label)}40`,
                        background: `${colorOf(label)}15`,
                        color: 'var(--fg)',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorOf(label) }}/>
                        {ptOf(label)} <span style={{ color: 'var(--fg-3)' }}>{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--line-2)' }}/>
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.1em', marginBottom: 8 }}>DETECCOES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {objetos.map((obj, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '8px 1fr auto',
                        gap: 9, alignItems: 'center', padding: '7px 0', fontSize: 12.5,
                        borderBottom: '1px solid var(--line-2)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 1, background: colorOf(obj.nome) }}/>
                        <span style={{ color: 'var(--fg)' }}>{ptOf(obj.nome)}</span>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: obj.isClose ? 'var(--danger)' : 'var(--fg-3)' }}>
                          {obj.distancia}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
        )}
        {tab === 'history' && (
          history.length === 0
            ? <Empty msg="Historico vazio" sub="Eventos aparecerão aqui." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {history.slice(0, 80).map((d: any, i: number) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                    gap: 10, padding: '8px 0', fontSize: 12,
                    borderBottom: '1px solid var(--line-2)',
                  }}>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--fg-3)', fontSize: 10.5 }}>{fmtTime(d.ts)}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--fg)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1, background: colorOf(d.nome) }}/>
                      {ptOf(d.nome)}
                    </span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--fg-3)', fontSize: 10.5 }}>{d.distancia}</span>
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    </aside>
  )
}
function LiveView({ analise, history, addSnapshot, settings, wsState }: any) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useFrameSender(video, wsState === 'OPEN')

  // Alvo atual vindo da IA + bboxes suavizados que são animados a cada frame.
  const targetRef = useRef<ObjetoDetectado[]>([])
  const lastSeenRef = useRef<number>(Date.now())
  useEffect(() => {
    if (!analise) return
    targetRef.current = analise.objetos
    lastSeenRef.current = Date.now()
  }, [analise])

  // Loop de animação: interpola as hitboxes em direção ao alvo (movimento fluido
  // mesmo com a IA respondendo só algumas vezes por segundo).
  useEffect(() => {
    let raf = 0
    let smooth: SmoothBox[] = []
    const SMOOTHING = 0.30 // 0=parado, 1=instantâneo
    const STALE_MS = 800   // sem nenhuma detecção há mais que isso → limpa tudo

    const tick = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const target = Date.now() - lastSeenRef.current > STALE_MS ? [] : targetRef.current
        smooth = matchAndLerp(smooth, target, SMOOTHING)
        drawBboxes(canvas, smooth, settings.showLabels, video)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [settings.showLabels, video])

  const takeSnapshot = useCallback(() => {
    if (!video) return
    const cap = document.createElement('canvas')
    cap.width = video.videoWidth; cap.height = video.videoHeight
    const ctx = cap.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    addSnapshot({
      id: `snap-${Date.now()}`,
      ts: Date.now(),
      thumb: cap.toDataURL('image/jpeg', 0.78),
      objetos: analise?.objetos ?? [],
    })
  }, [video, analise, addSnapshot])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', minHeight: 0 }}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div style={{
          position: 'relative', flex: 1, minHeight: 0,
          borderRadius: 14, overflow: 'hidden',
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)',
        }}>
          <ConnectionGuard wsState={wsState}>
            <CameraView onVideoReady={setVideo} />
            <canvas ref={canvasRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10,
            }}/>
          </ConnectionGuard>
          {wsState === 'OPEN' && (
            <>
              <div style={{
                position: 'absolute', left: 16, top: 16, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 6,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 1, background: 'var(--danger)', animation: 'rec 1.2s ease-in-out infinite' }}/>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.06em' }}>REC - LIVE</span>
              </div>
              <div style={{
                position: 'absolute', right: 16, top: 16, zIndex: 20,
                padding: '6px 10px', borderRadius: 6,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                fontFamily: 'Geist Mono, monospace', fontSize: 10.5,
                display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end',
              }}>
                <span>{analise?.objetos.length ?? 0} objetos</span>
                <span style={{ color: 'var(--fg-3)' }}>YOLOv8 - ativo</span>
              </div>
              <div style={{
                position: 'absolute', left: '50%', top: '50%', width: 22, height: 22,
                transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 20,
              }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(255,255,255,0.5)' }}/>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.5)' }}/>
              </div>
            </>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
        }}>
          <button onClick={takeSnapshot} disabled={wsState !== 'OPEN'} style={ghostBtn}>
            <Icon d={ICONS.shot} size={13}/> Snapshot
          </button>
        </div>
      </div>
      <Inspector analise={analise} history={history} wsState={wsState}/>
      <style>{`@keyframes rec{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}

function SessionsView({ sessions, setSessions }: any) {
  const remove = (id: string) => setSessions(sessions.filter((s: any) => s.id !== id))
  return (
    <div style={{ padding: 24 }}>
      {sessions.length === 0 ? (
        <EmptyState title="Nenhuma sessao salva" sub="Capture snapshots na tela Live para que aparecam aqui." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s: any) => (
            <div key={s.id} style={{
              padding: 20, borderRadius: 12,
              border: '1px solid var(--line)', background: 'var(--bg-2)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{fmtDate(s.ts)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-3)', fontFamily: 'Geist Mono, monospace' }}>
                  {s.objetos?.length ?? 0} objetos detectados
                </div>
              </div>
              <button onClick={() => remove(s.id)} style={{ ...ghostBtn, padding: '6px 10px', color: 'var(--fg-3)' }}>
                <Icon d={ICONS.trash} size={12}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryView({ snapshots, setSnapshots }: any) {
  const [sel, setSel] = useState<any>(null)
  const remove = (id: string) => setSnapshots(snapshots.filter((s: any) => s.id !== id))
  return (
    <div style={{ padding: 24 }}>
      {snapshots.length === 0 ? (
        <EmptyState title="Galeria vazia" sub="Capture snapshots durante a captura para ve-los aqui." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {snapshots.map((s: any) => (
            <div key={s.id} onClick={() => setSel(s)} style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--line)', background: 'var(--bg-2)', cursor: 'pointer',
            }}>
              <img src={s.thumb} alt="snapshot" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }}/>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: 'var(--fg-3)', marginBottom: 4 }}>{fmtDate(s.ts)}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                  {s.objetos?.length ?? 0} objetos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {sel && (
        <div onClick={() => setSel(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 40,
        }}>
          <div onClick={(e: any) => e.stopPropagation()} style={{
            maxWidth: 900, width: '100%', borderRadius: 14,
            background: 'var(--bg-2)', border: '1px solid var(--line)', overflow: 'hidden',
          }}>
            <img src={sel.thumb} style={{ width: '100%', display: 'block' }} alt="snapshot"/>
            <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--fg-3)' }}>{fmtDate(sel.ts)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={sel.thumb} download={`sensus-${sel.id}.jpg`} style={{ ...ghostBtn, textDecoration: 'none' }}>
                  <Icon d={ICONS.download} size={13}/> Baixar
                </a>
                <button onClick={() => { remove(sel.id); setSel(null) }} style={{ ...ghostBtn, color: 'var(--danger)' }}>
                  <Icon d={ICONS.trash} size={13}/> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ label, value, onChange }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'center' }}>
      <label style={{ fontSize: 13, color: 'var(--fg-2)' }}>{label}</label>
      <button onClick={() => onChange(!value)} style={{
        width: 38, height: 22, borderRadius: 100, border: 'none', padding: 2,
        background: value ? 'var(--accent)' : 'var(--bg-4)',
        position: 'relative', cursor: 'pointer',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--fg)', transition: 'left .15s',
        }}/>
      </button>
    </div>
  )
}

function Section({ title, sub, children }: any) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--line-2)' }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.01em' }}>{title}</h3>
        {sub && <p style={{ fontSize: 12.5, color: 'var(--fg-3)', margin: 0 }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function SettingsView({ settings, setSettings }: any) {
  const set = (k: string, v: any) => setSettings({ ...settings, [k]: v })
  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <Section title="Visualizacao" sub="Como as deteccoes aparecem sobre o feed.">
        <Toggle label="Mostrar rotulos" value={settings.showLabels} onChange={(v: boolean) => set('showLabels', v)} />
        <Toggle label="Mostrar distancia" value={settings.showDistance} onChange={(v: boolean) => set('showDistance', v)} />
      </Section>
      <Section title="Narracao em audio (TTS)" sub="O Sensus pode descrever o ambiente em voz alta.">
        <Toggle label="Ativar narracao" value={settings.ttsEnabled} onChange={(v: boolean) => set('ttsEnabled', v)} />
      </Section>
      <Section title="Sobre" sub={null}>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          Sensus v0.4 - build 2026.05<br/>
          Camada de percepcao espacial para dispositivos XR.<br/>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11.5, color: 'var(--fg-3)' }}>
            Projeto desenvolvido na disciplina de Solucoes Web.
          </span>
        </div>
      </Section>
    </div>
  )
}

function XRView({ onExit, analise, wsState }: any) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [arActive, setArActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useFrameSender(video, wsState === 'OPEN')

  useEffect(() => {
    if (!canvasRef.current || !analise) return
    drawBboxes(canvasRef.current, analise.objetos, true, null)
  }, [analise])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit])

  const handleEnterAR = useCallback(() => {
    // dom-overlay deixa a UI 2D (canvas das hitboxes) visível por cima do passthrough.
    startSession('immersive-ar', {
      requiredFeatures: ['local-floor'],
      optionalFeatures: [
        'hand-tracking', 'bounded-floor', 'layers',
        'dom-overlay',
      ],
      domOverlay: { root: document.body },
    } as XRSessionInit)
      .then((session) => {
        if (!session) return
        setArActive(true)
        session.addEventListener('end', () => setArActive(false))
      })
      .catch((err) => {
        console.error('[XR] falha ao iniciar AR:', err)
      })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: arActive ? 'transparent' : '#000', zIndex: 1000 }}>

      {/* Canvas XR montado SEMPRE — precisa existir antes da sessão iniciar para
          capturá-la e conectar o passthrough ao renderer (senão fica preto). */}
      <XRScene />
      <CameraView onVideoReady={setVideo} hidden />
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10,
      }}/>

      {/* Botão de entrada — WebXR exige gesto do usuário */}
      {!arActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, letterSpacing: '0.1em' }}>SENSUS AI</span>
          <button onClick={handleEnterAR} style={{
            padding: '28px 56px', borderRadius: 100,
            background: '#00ffcc', color: '#000',
            fontSize: 22, fontWeight: 700, fontFamily: 'inherit',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 0 50px rgba(0,255,200,0.5)',
            touchAction: 'manipulation',
          }}>
            INICIAR AR
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Meta Quest 2 / 3</span>
        </div>
      )}

      <div style={{
        position: 'absolute', left: 24, top: 24, zIndex: 20,
        display: 'inline-flex', alignItems: 'center', gap: 9,
        padding: '8px 14px', borderRadius: 8,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Mark size={18}/>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>SENSUS XR</span>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>QUEST AR</span>
      </div>
      <div style={{
        position: 'absolute', right: 24, top: 24, zIndex: 20,
        padding: '10px 14px', borderRadius: 8,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end',
      }}>
        <span>{analise?.objetos.length ?? 0} objetos</span>
        <span style={{ opacity: 0.6 }}>YOLOv8 - {wsState === 'OPEN' ? 'ativo' : 'offline'}</span>
      </div>
      <button onClick={onExit} style={{
        position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)', zIndex: 20,
        padding: '12px 20px', borderRadius: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <Icon d={ICONS.expand} size={13}/> Sair
      </button>
    </div>
  )
}

export function App() {
  const { wsState } = useWebSocket()
  const [view, setView] = useState('live')
  // Initialize true on Quest so XRView renders on the very first paint (no flash of normal UI)
  const [xrMode, setXrMode] = useState(() => isMetaQuest())
  const [analise, setAnalise] = useState<AnaliseResponse | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [sessions, setSessions] = useLocalState<any[]>('sensus.sessions', [])
  const [snapshots, setSnapshots] = useLocalState<any[]>('sensus.snapshots', [])
  const [settings, setSettings] = useLocalState('sensus.settings', {
    showLabels: true, showDistance: true, ttsEnabled: true,
  })

  const { announce } = useAudioAnnouncer()
  const appRootRef = useRef<HTMLDivElement>(null)

  const handleEnterXR = useCallback(() => {
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(''); u.volume = 0
      window.speechSynthesis.speak(u)
    }
    setXrMode(true)
  }, [])

  const handleExitXR = useCallback(() => {
    setXrMode(false)
  }, [])

  const seenRef = useRef<Map<string, number>>(new Map())
  const addHistory = useCallback((evt: any) => {
    const last = seenRef.current.get(evt.nome) ?? 0
    if (Date.now() - last < 3000) return
    seenRef.current.set(evt.nome, Date.now())
    setHistory(h => [evt, ...h].slice(0, 200))
  }, [])

  const addSnapshot = useCallback((snap: any) => {
    setSnapshots((s: any[]) => [snap, ...s].slice(0, 60))
    setSessions((s: any[]) => [snap, ...s].slice(0, 100))
  }, [setSnapshots, setSessions])

  useEffect(() => {
    const handler = (data: unknown) => {
      if (isWebSocketError(data)) return
      if (isAnaliseResponse(data)) {
        setAnalise(data)
        const seen = new Set<string>()
        data.objetos.forEach(obj => {
          if (!seen.has(obj.nome)) {
            seen.add(obj.nome)
            addHistory({ ...obj, ts: Date.now() })
          }
        })
        announce(data.objetos, (settings as any).ttsEnabled ?? false)
      }
    }
    webSocketService.onMessage(handler)
    return () => webSocketService.offMessage(handler)
  }, [addHistory, announce, settings])

  if (xrMode) return <XRView onExit={handleExitXR} analise={analise} wsState={wsState}/>

  return (
    <div ref={appRootRef} style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar view={view} setView={setView} onXR={handleEnterXR} sessions={sessions} wsState={wsState}/>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <TopBar view={view}/>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {view === 'live' && <LiveView analise={analise} history={history} addSnapshot={addSnapshot} settings={settings} wsState={wsState}/>}
          {view === 'sessions' && <SessionsView sessions={sessions} setSessions={setSessions}/>}
          {view === 'gallery' && <GalleryView snapshots={snapshots} setSnapshots={setSnapshots}/>}
          {view === 'settings' && <SettingsView settings={settings} setSettings={setSettings}/>}
        </div>
      </div>
      <StatusIndicator wsState={wsState}/>
    </div>
  )
}