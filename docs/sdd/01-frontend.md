# SDD 01 — Frontend XR

# Purpose

This document defines the frontend architecture for Sensus AI.

The frontend is responsible for:

* camera frame capture
* websocket communication
* realtime overlay rendering
* accessibility feedback
* WebXR rendering
* immersive interaction
* realtime UI updates

The frontend acts as the primary user interaction layer.

---

# Frontend Responsibilities

The frontend MUST:

* capture realtime camera frames
* compress frames efficiently
* stream frames to backend
* receive realtime detections
* render overlays
* provide accessibility feedback
* support mobile rendering
* support WebXR rendering
* support reconnect logic
* survive websocket failures

---

# Stack

Required stack:

```txt
React
TypeScript
Vite
Zustand
WebXR
WebSocket API
```

---

# Project Location

```txt
apps/frontend-xr
```

---

# Architecture Style

The frontend follows:

```txt
Realtime reactive architecture
```

Primary goals:

* low latency
* responsive rendering
* XR compatibility
* accessibility-first UX

---

# Recommended Structure

```txt
src/
├── components/
├── websocket/
├── hooks/
├── store/
├── xr/
├── overlay/
├── accessibility/
├── services/
├── lib/
├── utils/
└── types/
```

---

# Main Realtime Flow

## Step 1 — Camera Capture

Capture camera frames.

---

## Step 2 — Frame Compression

Compress frames before upload.

---

## Step 3 — WebSocket Upload

Send FramePayload to backend.

---

## Step 4 — Receive AnalysisResponse

Receive normalized detections.

---

## Step 5 — State Update

Update realtime application state.

---

## Step 6 — Overlay Rendering

Render bounding boxes and labels.

---

## Step 7 — Accessibility Feedback

Trigger audio and visual feedback.

---

# Camera Capture Rules

The frontend MUST:

* support browser camera APIs
* support mobile cameras
* support Quest camera passthrough
* throttle frame capture
* avoid excessive memory usage

---

# Frame Compression Rules

Frames MUST:

* use JPEG encoding
* remain below 500KB
* prioritize low latency

Recommended resolution:

```txt
640x480
```

---

# WebSocket Client

## Responsibilities

The websocket layer MUST:

* connect automatically
* reconnect automatically
* support heartbeat events
* handle disconnects safely
* throttle uploads
* support realtime updates

---

## Connection Endpoint

```txt
/ws/realtime
```

---

## Reconnect Rules

Frontend MUST:

* reconnect automatically
* retry progressively
* recover state after reconnect

---

# State Management

## State Library

Use:

```txt
Zustand
```

---

# Realtime State

Realtime state MUST include:

* websocket status
* latest detections
* latency metrics
* FPS metrics
* connection errors
* accessibility events

---

# Overlay Rendering

## Responsibilities

The overlay system MUST:

* render bounding boxes
* render labels
* render confidence indicators
* update in realtime
* avoid blocking rendering

---

## Overlay Rules

Overlays MUST:

* scale responsively
* support mobile screens
* support XR rendering
* support high contrast mode

---

# Accessibility System

## Responsibilities

Accessibility layer MUST:

* announce obstacles
* announce proximity alerts
* avoid repeated spam alerts
* support speech synthesis
* support visual accessibility

---

## Accessibility Events

Examples:

```txt
Obstacle ahead
Object detected
Very close obstacle
```

---

# Audio Feedback

The frontend SHOULD support:

* speech synthesis
* directional audio
* proximity warnings
* debounce repeated alerts

---

# WebXR Integration

## Responsibilities

The XR layer MUST:

* support Meta Quest
* support immersive overlays
* support realtime rendering
* support passthrough rendering

---

## XR Rules

XR rendering MUST:

* avoid heavy DOM operations
* prioritize GPU rendering
* maintain stable FPS

---

# Performance Constraints

## Target FPS

```txt
10-15 FPS
```

---

## Minimum FPS

```txt
5 FPS
```

---

## Maximum WebSocket Latency

```txt
300ms
```

---

## Rendering Constraints

Frontend MUST:

* avoid unnecessary rerenders
* throttle expensive operations
* avoid large state updates
* avoid blocking UI thread

---

# Error Handling

Frontend MUST:

* survive websocket disconnects
* display connection state
* recover from websocket failures
* handle invalid responses safely

---

# Validation Rules

Frontend MUST validate:

* websocket payloads
* contract schemas
* image encoding
* websocket event types

---

# Security Rules

Frontend MUST:

* avoid arbitrary file uploads
* validate websocket responses
* sanitize displayed text
* avoid unsafe rendering

---

# Mobile Support

Frontend MUST support:

* Android browsers
* mobile rendering
* responsive overlays
* touch interactions

---

# Quest Support

Frontend SHOULD support:

* Quest Browser
* immersive WebXR sessions
* passthrough camera rendering

---

# Observability

Frontend MUST expose:

* FPS metrics
* websocket latency
* reconnect counts
* dropped frames
* rendering metrics

---

# Docker Rules

Frontend MUST:

* run in Docker
* support environment variables
* expose configurable ports

---

# Environment Variables

Required variables:

```txt
VITE_BACKEND_WS_URL
VITE_API_URL
VITE_ENABLE_XR
```

---

# Testing Rules

Frontend MUST include:

* component tests
* websocket tests
* rendering tests
* accessibility tests

---

# Accessibility Principles

Accessibility is mandatory.

The frontend MUST support:

* high contrast overlays
* readable labels
* audio guidance
* realtime feedback
* visual clarity

---

# Future Improvements

Future versions may support:

* spatial mapping
* gesture controls
* gaze interaction
* SLAM overlays
* object persistence
* collaborative XR

---

# Definition of Done

A frontend feature is complete only if:

* follows shared contracts
* supports realtime updates
* survives reconnects
* supports mobile rendering
* avoids blocking UI
* supports accessibility
* passes performance constraints

---

# Source of Truth

All frontend implementations MUST follow:

* docs/sdd/01-frontend.md
* docs/sdd/04-websocket-contracts.md
* root CLAUDE.md
