import { config } from '../config/app.config'
import { captureFrame } from '../utils/image.utils'

class CameraService {
  private stream: MediaStream | null = null

  async start(): Promise<HTMLVideoElement> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: config.WIDTH },
        height: { ideal: config.HEIGHT },
        facingMode: 'environment',
      },
      audio: false,
    })

    const video = document.createElement('video')
    video.srcObject = this.stream
    video.autoplay = true
    video.playsInline = true
    await video.play()

    return video
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  captureFrame(video: HTMLVideoElement): string {
    return captureFrame(video)
  }
}

export const cameraService = new CameraService()
