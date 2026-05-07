import { config } from '../config/app.config'

export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = config.WIDTH
  canvas.height = config.HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.drawImage(video, 0, 0, config.WIDTH, config.HEIGHT)
  return canvas.toDataURL('image/jpeg', config.QUALITY)
}
