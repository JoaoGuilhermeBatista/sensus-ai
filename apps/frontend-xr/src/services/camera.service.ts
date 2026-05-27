import { config } from '../config/app.config'
import { captureFrame } from '../utils/image.utils'

class CameraService {
  private stream: MediaStream | null = null

  private async pickRealCameraId(): Promise<string | undefined> {
    // Needs a throwaway getUserMedia first so labels are populated (browser security)
    let tempStream: MediaStream | null = null
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    } catch {
      return undefined
    }
    tempStream.getTracks().forEach(t => t.stop())

    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(d => d.kind === 'videoinput')

    const VIRTUAL_PATTERN = /virtual|obs|manycam|snap|droidcam|epoccam|iriun|vcam|mmhmm|camo|reincubate|xsplit|streamlabs/i

    const physical = videoDevices.filter(d => !VIRTUAL_PATTERN.test(d.label))
    const candidates = physical.length > 0 ? physical : videoDevices

    // On mobile/Quest prefer back camera
    const back = candidates.find(d => /back|rear|environment|traseira/i.test(d.label))
    return (back ?? candidates[0])?.deviceId
  }

  async start(): Promise<HTMLVideoElement> {
    const deviceId = await this.pickRealCameraId()

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: config.WIDTH },
      height: { ideal: config.HEIGHT },
      ...(deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'environment' }),
    }

    this.stream = await navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: false })
      .catch(() =>
        // Last resort: any camera
        navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: config.WIDTH }, height: { ideal: config.HEIGHT } },
          audio: false,
        }),
      )

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
