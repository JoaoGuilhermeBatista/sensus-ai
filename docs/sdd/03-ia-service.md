# SDD 03 — IA Service

# Purpose

This document defines the AI inference architecture for Sensus AI.

The AI service is responsible for:

* realtime object detection
* frame processing
* YOLO inference
* detection normalization
* inference optimization
* GPU utilization
* AI health monitoring

The AI service acts as the computer vision engine of the platform.

---

# Service Responsibilities

The AI service MUST:

* receive image frames
* preprocess frames
* run YOLO inference
* normalize detections
* return structured responses
* support realtime workloads
* expose health endpoints
* expose inference metrics
* support GPU acceleration

---

# Stack

Required stack:

```txt
Python 3.12
FastAPI
YOLOv8
PyTorch
OpenCV
Uvicorn
```

---

# Project Location

```txt
apps/ia-service
```

---

# Architecture Style

The AI service follows:

```txt
Realtime inference architecture
```

Primary goal:

```txt
low-latency object detection
```

---

# Main Inference Pipeline

## Step 1 — Receive Frame

Receive image frame from backend.

---

## Step 2 — Decode Image

Convert base64 payload into image matrix.

---

## Step 3 — Validate Image

Reject invalid payloads.

---

## Step 4 — Preprocessing

Apply image normalization and resizing.

---

## Step 5 — YOLO Inference

Run realtime object detection.

---

## Step 6 — Postprocessing

Normalize detections.

---

## Step 7 — Response Serialization

Return structured JSON response.

---

# API Design

## Communication Protocol

Initial communication protocol:

```txt
HTTP REST
```

Future versions may support:

* gRPC
* websocket streaming
* edge inference

---

# Required Endpoints

## Health Endpoint

```txt
GET /health
```

Returns:

* service status
* model loaded state
* GPU availability
* inference readiness

---

## Inference Endpoint

```txt
POST /infer
```

Receives:

* base64 JPEG frame

Returns:

* normalized detections

---

# Request Contract

## InferRequest

```ts
type InferRequest = {
  frameId: string
  timestamp: number
  image: string
}
```

---

# Response Contract

## InferResponse

```ts
type InferResponse = {
  frameId: string
  timestamp: number
  inferenceMs: number
  objects: DetectedObject[]
}
```

---

# Shared Contracts

The AI service MUST follow:

```txt
packages/shared-contracts
```

No duplicated DTOs are allowed.

---

# Detection Rules

## DetectedObject

All detections MUST include:

* object label
* confidence score
* bounding box
* distance estimation

---

## Confidence Range

```txt
0.0 → 1.0
```

---

## Confidence Threshold

Initial threshold:

```txt
0.5
```

Threshold MUST be configurable.

---

# Bounding Box Rules

Bounding boxes MUST:

* be normalized
* use relative coordinates
* use values from 0 → 1

---

# Distance Estimation

Initial distance estimation is heuristic-based.

Possible values:

```txt
perto
medio
longe
```

Future versions may support:

* depth estimation
* stereo vision
* SLAM integration

---

# Model Management

## Initial Model

Initial model:

```txt
YOLOv8n
```

Optimized for:

* low latency
* realtime inference
* mobile-oriented workloads

---

# Model Storage

Models MUST NOT be committed into Git.

Use:

* external downloads
* mounted volumes
* artifact storage

---

# GPU Rules

The AI service SHOULD:

* use GPU acceleration
* fallback safely to CPU
* expose GPU health
* monitor VRAM usage

---

# Performance Constraints

## Target Inference Time

```txt
< 250ms
```

---

## Maximum Acceptable Inference Time

```txt
< 1000ms
```

---

## Target FPS

```txt
10-15 FPS
```

---

# Memory Constraints

The service MUST:

* avoid memory leaks
* release unused tensors
* avoid storing frames unnecessarily
* avoid excessive buffering

---

# Error Handling

The AI service MUST:

* reject malformed images
* reject invalid base64 payloads
* timeout safely
* avoid crashing inference pipeline
* return normalized errors

---

# Logging Rules

Logs MUST:

* avoid storing image payloads
* avoid excessive verbosity
* expose inference metrics
* expose model loading state

---

# Validation Rules

The AI service MUST validate:

* image encoding
* payload size
* request structure
* image dimensions

---

# Security Rules

The AI service MUST:

* reject oversized payloads
* reject unsupported formats
* avoid arbitrary file uploads
* avoid filesystem exposure

---

# Docker Rules

The AI service MUST:

* run in Docker
* support GPU runtime
* support environment variables
* expose health checks

---

# Environment Variables

Required variables:

```txt
MODEL_PATH
CONFIDENCE_THRESHOLD
MAX_IMAGE_SIZE
DEVICE
LOG_LEVEL
```

---

# Observability

The AI service MUST expose:

* inference latency
* FPS metrics
* GPU usage
* VRAM usage
* active requests
* model readiness

---

# Dataset Rules

Datasets MUST:

* remain outside Git tracking
* support versioning
* support reproducibility
* include metadata

---

# Training Rules

Training pipelines MUST:

* remain separate from inference runtime
* avoid interfering with production inference
* support reproducible runs

---

# Realtime Reliability

The AI service MUST:

* survive malformed requests
* survive inference failures
* fail safely
* recover after crashes
* support degraded operation mode

---

# Future Improvements

Future versions may support:

* object tracking
* semantic segmentation
* OCR
* multimodal AI
* depth estimation
* edge inference
* quantized models
* TensorRT optimization

---

# Testing Rules

The AI service MUST include:

* inference tests
* endpoint tests
* validation tests
* performance tests

---

# Definition of Done

An AI feature is complete only if:

* follows shared contracts
* exposes normalized detections
* supports realtime inference
* validates payloads
* handles errors safely
* supports GPU fallback
* passes performance constraints

---

# Source of Truth

All AI implementations MUST follow:

* docs/sdd/03-ia-service.md
* docs/sdd/04-websocket-contracts.md
* root CLAUDE.md
