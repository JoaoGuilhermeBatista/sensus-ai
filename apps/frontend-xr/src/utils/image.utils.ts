import { config } from '../config/app.config'

export function captureFrame(video: HTMLVideoElement): string {
  const vw = video.videoWidth || config.WIDTH
  const vh = video.videoHeight || config.HEIGHT

  // Scale down proportionally so the longest side is at most config.WIDTH.
  // This preserves the camera's native aspect ratio so YOLO bbox coordinates
  // stay consistent with what the video overlay displays.
  const scale = Math.min(1, config.WIDTH / Math.max(vw, vh))
  const w = Math.round(vw * scale)
  const h = Math.round(vh * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.drawImage(video, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', config.QUALITY)
}
