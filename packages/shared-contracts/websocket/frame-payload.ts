export type FrameEncoding = 'jpeg'

export type FramePayload = {
  type: 'frame'
  frameId: string
  timestamp: number
  encoding: FrameEncoding
  data: string
}

export type HeartbeatPayload = {
  type: 'heartbeat'
  timestamp: number
}

export type FrontendMessage = FramePayload | HeartbeatPayload