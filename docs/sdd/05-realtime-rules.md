# SDD 05 — Realtime Rules

# Purpose

This document defines all realtime constraints, guarantees, and performance rules for Sensus AI.

The platform is a realtime distributed system.

All services MUST follow these realtime rules.

This document defines:

* latency constraints
* FPS constraints
* reconnect behavior
* buffering rules
* throttling
* frame dropping
* timeout handling
* websocket reliability
* realtime resilience

---

# Realtime Philosophy

The system prioritizes:

```txt
Realtime responsiveness over perfect accuracy
```

Low latency is more important than processing every frame.

---

# Core Realtime Goals

The system MUST:

* maintain realtime responsiveness
* avoid blocking operations
* degrade gracefully under load
* avoid websocket flooding
* recover from temporary failures

---

# End-to-End Latency

## Target Latency

```txt
< 300ms
```

Measured from:

```txt
camera capture → overlay rendering
```

---

## Maximum Acceptable Latency

```txt
< 1000ms
```

Above this threshold:

* frames may be dropped
* warnings may be triggered

---

# FPS Rules

## Recommended FPS

```txt
10-15 FPS
```

---

## Minimum Acceptable FPS

```txt
5 FPS
```

---

## FPS Priorities

The system SHOULD:

* prioritize stable FPS
* avoid FPS spikes
* avoid UI freezes

---

# Frame Capture Rules

Frontend MUST:

* throttle frame capture
* avoid uploading every raw frame
* avoid browser memory growth
* prioritize recent frames

---

## Recommended Frame Resolution

```txt
640x480
```

---

## Maximum Payload Size

```txt
500KB
```

---

# Frame Dropping Rules

The system MUST support:

```txt
frame dropping
```

Realtime systems SHOULD:

* process recent frames first
* discard stale frames
* avoid large processing queues

---

## Prioritization Strategy

Prefer:

```txt
latest frame wins
```

instead of:

```txt
queueing every frame
```

---

# Backpressure Rules

The system MUST:

* detect overload
* throttle uploads
* avoid queue explosions
* reject excessive payloads

---

# WebSocket Reliability

## Frontend Requirements

Frontend MUST:

* reconnect automatically
* retry progressively
* survive temporary disconnects
* preserve minimal state

---

## Backend Requirements

Backend MUST:

* survive reconnect storms
* avoid blocking websocket handlers
* handle concurrent sessions safely

---

## AI Service Requirements

AI service MUST:

* timeout safely
* reject invalid payloads
* avoid inference deadlocks

---

# Reconnect Strategy

## Progressive Retry

Reconnect intervals:

```txt
1s
2s
5s
10s
```

Maximum retry interval:

```txt
30s
```

---

# Heartbeat Rules

The system MUST support:

```txt
heartbeat events
```

---

## Heartbeat Interval

Recommended:

```txt
15 seconds
```

---

## Idle Timeout

Connections may be closed after:

```txt
60 seconds idle
```

---

# Timeout Rules

## AI Timeout

Maximum AI inference timeout:

```txt
3 seconds
```

---

## WebSocket Timeout

Maximum websocket inactivity timeout:

```txt
60 seconds
```

---

# Compression Rules

Frames MUST:

* use JPEG compression
* prioritize low latency
* avoid excessive quality

---

## Recommended JPEG Quality

```txt
0.6 - 0.8
```

---

# Memory Rules

All services MUST:

* avoid unbounded queues
* avoid memory leaks
* release unused resources
* avoid buffering large image histories

---

# CPU Rules

The system MUST:

* avoid blocking loops
* avoid synchronous heavy operations
* prioritize async processing

---

# GPU Rules

The AI service SHOULD:

* use GPU acceleration
* monitor VRAM usage
* fallback safely to CPU

---

# Rendering Rules

Frontend MUST:

* avoid unnecessary rerenders
* throttle expensive rendering
* prioritize smooth UI updates
* avoid large DOM trees

---

# Overlay Rendering Rules

Overlays MUST:

* update incrementally
* avoid full redraws when possible
* scale responsively

---

# Accessibility Realtime Rules

Accessibility feedback MUST:

* avoid repetitive alerts
* debounce repeated messages
* prioritize critical obstacles

---

## Critical Alert Priority

Highest priority:

```txt
very close obstacles
```

---

# Error Recovery Rules

The system MUST:

* survive malformed frames
* survive websocket disconnects
* survive AI failures
* recover automatically when possible

---

# Degraded Mode

The platform SHOULD support:

```txt
degraded realtime mode
```

Examples:

* reduced FPS
* lower image resolution
* lower inference quality

---

# Metrics Rules

The system MUST expose:

* websocket latency
* FPS
* reconnect count
* dropped frames
* inference latency
* render time

---

# Logging Rules

Realtime logs MUST:

* avoid excessive verbosity
* avoid logging image payloads
* avoid blocking operations

---

# Security Realtime Rules

The system MUST:

* reject oversized payloads
* reject malformed JSON
* throttle websocket abuse
* limit concurrent uploads

---

# Queue Rules

Queues MUST:

* remain bounded
* discard stale frames
* avoid infinite growth

---

# Scalability Goals

Target scalability:

```txt
100+ concurrent websocket sessions
```

---

# Future Realtime Improvements

Future versions may include:

* adaptive FPS
* dynamic compression
* predictive buffering
* edge inference
* distributed websocket clusters
* GPU scheduling

---

# Definition of Done

A realtime feature is complete only if:

* avoids blocking operations
* survives reconnects
* supports frame dropping
* respects latency constraints
* supports throttling
* supports degraded mode
* exposes metrics

---

# Source of Truth

All realtime implementations MUST follow:

* docs/sdd/05-realtime-rules.md
* docs/sdd/04-websocket-contracts.md
* root CLAUDE.md
