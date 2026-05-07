# SDD 04 — WebSocket Contracts

# Purpose

This document defines all realtime communication contracts used by:

* frontend-xr
* backend-api
* ia-service

This document is the official source of truth for:

* websocket payloads
* realtime events
* shared DTOs
* websocket validation
* event normalization

All services MUST follow these contracts.

No duplicated websocket DTOs are allowed.

---

# Shared Contracts Location

All websocket contracts MUST be implemented inside:

```txt
packages/shared-contracts
```

Recommended structure:

```txt
packages/shared-contracts/
├── websocket/
├── types/
├── schemas/
└── events/
```

---

# Realtime Communication Overview

## Main Flow

```txt
Frontend XR
    ↓ websocket
Backend API
    ↓ HTTP/WebSocket
AI Service
    ↓
Backend API
    ↓ websocket
Frontend XR
```

---

# WebSocket Connection Rules

## Protocol

Use:

```txt
WebSocket
```

No Socket.IO.

---

## Encoding

Payloads MUST use:

```txt
JSON
```

---

## Binary Uploads

Image frames MUST be encoded as:

```txt
base64 JPEG
```

---

# Global Payload Rules

All payloads MUST:

* be serializable
* include a type field
* include timestamps
* use camelCase
* avoid nullable fields when possible
* be validated before processing

---

# Payload Versioning

Future versions MUST support:

```txt
version
```

field.

Example:

```json
{
  "version": "1.0",
  "type": "frame"
}
```

Initial implementation may omit versioning.

---

# Frontend → Backend Contracts

---

# FramePayload

## Purpose

Send captured camera frames from frontend to backend.

---

## TypeScript Contract

```ts
export type FramePayload = {
  type: 'frame'
  frameId: string
  timestamp: number
  encoding: 'jpeg'
  data: string
}
```

---

## Rules

### frameId

MUST be:

* UUID
* unique per frame

---

### timestamp

Unix timestamp in milliseconds.

---

### encoding

Initial supported values:

```txt
jpeg
```

Future values may include:

* webp
* png

---

### data

Base64 encoded JPEG.

---

## Constraints

Maximum payload size:

```txt
500KB
```

Recommended image size:

```txt
640x480
```

---

# HeartbeatPayload

## Purpose

Keep websocket connection alive.

---

## TypeScript Contract

```ts
export type HeartbeatPayload = {
  type: 'heartbeat'
  timestamp: number
}
```

---

# Backend → Frontend Contracts

---

# AnalysisResponse

## Purpose

Send normalized AI detections to frontend.

---

## TypeScript Contract

```ts
export type AnalysisResponse = {
  type: 'analysis'
  frameId: string
  timestamp: number
  latencyMs: number
  objects: DetectedObject[]
}
```

---

## Rules

### frameId

MUST match original FramePayload.

---

### latencyMs

Represents:

```txt
end-to-end realtime latency
```

including:

* upload
* backend processing
* AI inference

---

### objects

List of normalized detected objects.

May be empty.

---

# ErrorResponse

## Purpose

Send realtime processing errors.

---

## TypeScript Contract

```ts
export type ErrorResponse = {
  type: 'error'
  code: string
  message: string
  timestamp: number
}
```

---

## Example Codes

```txt
INVALID_PAYLOAD
PAYLOAD_TOO_LARGE
IA_TIMEOUT
INFERENCE_ERROR
RATE_LIMITED
WEBSOCKET_DISCONNECTED
```

---

# Shared Types

---

# DetectedObject

## Purpose

Represent normalized object detection.

---

## TypeScript Contract

```ts
export type DetectedObject = {
  name: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
  distance: 'perto' | 'medio' | 'longe'
  isClose: boolean
}
```

---

## Bounding Box Rules

Bounding boxes MUST:

* be normalized
* use values from 0 → 1
* be relative to image dimensions

---

## Coordinate System

```txt
x → left position
y → top position
```

---

## Distance Rules

Possible values:

```txt
perto
medio
longe
```

---

## Confidence Rules

Range:

```txt
0.0 → 1.0
```

---

# Validation Rules

All websocket payloads MUST:

* use Zod validation on frontend
* use backend validation
* reject invalid payloads
* reject oversized payloads
* reject malformed JSON

---

# Realtime Constraints

---

## Maximum WebSocket Latency

```txt
300ms
```

---

## Maximum Reconnect Time

```txt
3 seconds
```

---

## Minimum FPS

```txt
5 FPS
```

---

## Recommended FPS

```txt
10-15 FPS
```

---

# WebSocket Reliability Rules

Frontend MUST:

* reconnect automatically
* queue unsent frames
* throttle frame upload
* avoid websocket flooding

Backend MUST:

* validate payloads
* reject oversized frames
* avoid blocking handlers
* support concurrent sessions

AI Service MUST:

* timeout safely
* reject invalid images
* avoid crashing websocket pipeline

---

# Event Lifecycle

## Realtime Sequence

### Step 1

Frontend captures frame.

### Step 2

Frontend sends FramePayload.

### Step 3

Backend validates payload.

### Step 4

Backend forwards image to AI service.

### Step 5

AI performs inference.

### Step 6

Backend normalizes detections.

### Step 7

Backend sends AnalysisResponse.

### Step 8

Frontend renders overlays.

---

# Security Rules

WebSocket servers MUST:

* limit payload sizes
* reject invalid JSON
* rate limit excessive requests
* support authentication
* avoid arbitrary binary uploads

---

# Future Extensions

Future websocket contracts may include:

* spatial mapping
* depth estimation
* tracking IDs
* voice events
* SLAM data
* collaborative XR events

---

# Source of Truth

All websocket implementations MUST follow this document.

No websocket payloads may exist outside shared contracts.
