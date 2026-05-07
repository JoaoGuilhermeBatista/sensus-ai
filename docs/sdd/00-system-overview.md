# SDD 00 — System Overview

# Sensus AI

## Purpose

Sensus AI is a realtime assistive vision platform designed to help users identify objects, obstacles, and environmental information through computer vision and immersive interfaces.

The system uses:

* Realtime computer vision
* YOLO-based object detection
* WebSocket streaming
* React WebXR frontend
* Spring Boot realtime backend
* FastAPI AI inference service

The project follows:

* Monorepo architecture
* Spec Driven Development (SDD)
* Shared contract architecture
* Realtime-first design
* Accessibility-first principles

---

# High-Level Architecture

## Services

### Frontend XR

Responsibilities:

* Capture camera frames
* Connect to backend websocket
* Receive realtime detections
* Render overlays
* Render accessibility feedback
* Manage WebXR rendering
* Provide audio guidance

Stack:

* React
* TypeScript
* Vite
* Zustand
* WebXR
* WebSocket API

Location:

```txt
apps/frontend-xr
```

---

### Backend API

Responsibilities:

* WebSocket gateway
* Realtime orchestration
* Authentication
* Payload validation
* Rate limiting
* Realtime event distribution
* IA service integration
* Metrics and observability

Stack:

* Spring Boot
* Spring WebFlux
* WebSocket
* PostgreSQL
* Redis

Location:

```txt
apps/backend-api
```

---

### AI Service

Responsibilities:

* Receive image frames
* Run YOLO inference
* Normalize detections
* Return realtime analysis
* Expose health endpoints
* Manage GPU inference pipeline

Stack:

* FastAPI
* Python
* YOLOv8
* OpenCV
* PyTorch

Location:

```txt
apps/ia-service
```

---

# Monorepo Structure

```txt
sensus/
├── apps/
│   ├── frontend-xr/
│   ├── backend-api/
│   └── ia-service/
│
├── packages/
│   └── shared-contracts/
│
├── docs/
│   └── sdd/
│
├── infra/
│
├── docker-compose.yml
└── CLAUDE.md
```

---

# Shared Contracts

All services MUST use shared contracts.

No duplicated DTOs are allowed.

The package:

```txt
packages/shared-contracts
```

is the source of truth for:

* websocket payloads
* realtime events
* DTO schemas
* validation
* shared types

---

# Realtime Flow

## Main Realtime Pipeline

### Step 1 — Frame Capture

Frontend captures camera frames.

### Step 2 — Compression

Frames are compressed before transmission.

### Step 3 — WebSocket Upload

Frontend sends frame payloads to backend.

### Step 4 — Backend Validation

Backend validates payload structure and limits.

### Step 5 — AI Inference

Backend forwards frames to AI service.

### Step 6 — Detection Processing

AI service performs YOLO inference.

### Step 7 — Response Normalization

Backend normalizes AI response.

### Step 8 — Frontend Rendering

Frontend renders overlays and accessibility feedback.

---

# System Constraints

## Latency

Target latency:

```txt
< 300ms
```

Maximum acceptable latency:

```txt
< 1000ms
```

---

## FPS

Minimum acceptable FPS:

```txt
5 FPS
```

Target FPS:

```txt
15 FPS
```

---

## Payload Size

Maximum websocket payload size:

```txt
500KB
```

---

# Reliability Rules

The system MUST:

* survive websocket reconnects
* recover from AI service downtime
* avoid blocking realtime flow
* support degraded operation mode
* prevent websocket flooding
* throttle excessive frame rates

---

# Accessibility Principles

Accessibility is mandatory.

The system MUST support:

* audio feedback
* proximity alerts
* visual overlays
* obstacle warnings
* high contrast overlays
* large labels
* realtime feedback

---

# Security Principles

The system MUST:

* validate websocket payloads
* limit payload sizes
* reject malformed frames
* support authentication
* support rate limiting
* avoid arbitrary file uploads

---

# Observability

The system MUST expose:

* websocket latency metrics
* inference metrics
* FPS metrics
* backend health checks
* AI health checks
* error logs
* realtime telemetry

---

# Deployment Strategy

Local development uses:

```txt
Docker Compose
```

Future production deployment may use:

* Kubernetes
* NGINX
* Terraform
* Cloud GPU instances

---

# Branch Strategy

The project follows:

```txt
Trunk Based Development
```

Rules:

* one feature per branch
* small commits
* incremental changes
* avoid large rewrites

---

# Commit Convention

```txt
feat(scope):
fix(scope):
refactor(scope):
chore(scope):
docs(scope):
```

Examples:

```txt
feat(shared): add websocket contracts
feat(frontend): add websocket reconnect
refactor(backend): normalize websocket payloads
```

---

# Definition of Done

A feature is complete only if:

* follows SDD
* follows shared contracts
* has validation
* has error handling
* passes lint
* passes typecheck
* supports realtime safety
* avoids blocking operations

---

# Non-Goals

The system does NOT aim to:

* store raw video streams
* perform long-term video recording
* become a generic social XR platform
* support offline inference initially

---

# Future Roadmap

Future versions may include:

* edge inference
* SLAM integration
* spatial mapping
* object tracking
* depth estimation
* multimodal AI
* cloud synchronization
* collaborative XR sessions

---

# Source of Truth

The SDD documents inside:

```txt
docs/sdd
```

are the official architectural source of truth.

All implementations MUST follow these documents.
