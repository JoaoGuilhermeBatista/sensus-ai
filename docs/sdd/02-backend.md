# SDD 02 — Backend API

# Purpose

This document defines the backend architecture for Sensus AI.

The backend acts as:

* websocket gateway
* realtime orchestrator
* AI integration layer
* validation layer
* security layer
* observability layer

The backend is responsible for maintaining stable realtime communication between:

* frontend-xr
* ia-service

---

# Backend Responsibilities

The backend MUST:

* receive websocket frame streams
* validate websocket payloads
* enforce payload limits
* forward frames to AI service
* normalize AI responses
* distribute realtime events
* manage reconnect logic
* expose REST endpoints
* expose health endpoints
* expose metrics
* enforce security rules

---

# Stack

Required stack:

```txt
Java 21
Spring Boot
Spring WebFlux
Spring WebSocket
PostgreSQL
Redis
Maven
```

---

# Project Location

```txt
apps/backend-api
```

---

# Architecture Style

The backend follows:

```txt
Reactive realtime architecture
```

Blocking operations MUST be avoided in websocket flow.

---

# Package Organization

Recommended package structure:

```txt
src/main/java/com/sensus/backend/
├── config/
├── controller/
├── websocket/
├── dto/
├── integration/
├── service/
├── repository/
├── model/
├── mapper/
├── validation/
├── exception/
├── metrics/
└── security/
```

---

# Realtime Architecture

## Main Realtime Pipeline

### Step 1

Receive FramePayload via websocket.

### Step 2

Validate payload.

### Step 3

Enforce rate limits.

### Step 4

Forward image to AI service.

### Step 5

Receive AI response.

### Step 6

Normalize detections.

### Step 7

Send AnalysisResponse to frontend.

---

# WebSocket Gateway

## Responsibilities

The websocket layer MUST:

* manage realtime sessions
* validate payloads
* reject oversized payloads
* handle reconnects
* manage concurrent users
* support heartbeat events

---

## Connection Rules

Frontend clients connect to:

```txt
/ws/realtime
```

---

## Heartbeat

Backend MUST support heartbeat payloads.

Idle websocket sessions may be terminated.

---

# REST API

REST endpoints are secondary.

Primary communication is realtime websocket.

---

# Required Endpoints

## Health Endpoint

```txt
GET /api/health
```

Returns:

* backend status
* AI connectivity
* websocket health

---

## Metrics Endpoint

```txt
GET /api/metrics
```

Returns:

* websocket metrics
* latency metrics
* FPS metrics
* inference metrics

---

# AI Integration Layer

## Responsibilities

The integration layer MUST:

* send frames to AI service
* handle AI timeouts
* normalize AI responses
* handle inference failures
* avoid blocking operations

---

## Communication Protocol

Backend communicates with AI service using:

```txt
HTTP REST
```

Future versions may support:

* gRPC
* websocket streaming

---

## Timeout Rules

Maximum AI timeout:

```txt
3 seconds
```

Timed-out requests MUST:

* fail safely
* avoid crashing websocket flow

---

# DTO Rules

Backend MUST:

* avoid duplicated DTOs
* use shared contracts
* normalize websocket payloads
* validate all external payloads

---

# Database

## Purpose

Database storage is optional for realtime flow.

Primary focus:

```txt
low-latency realtime processing
```

---

## PostgreSQL Responsibilities

May store:

* analytics
* logs
* user sessions
* metrics
* historical detections

---

# Redis

Redis MUST be used for:

* rate limiting
* caching
* websocket scaling
* distributed events
* realtime state

---

# Rate Limiting

Backend MUST:

* throttle excessive frame uploads
* reject flooding attempts
* prevent websocket abuse

---

## Initial Limits

Recommended initial limit:

```txt
15 FPS per client
```

---

# Validation Rules

Backend MUST reject:

* malformed JSON
* oversized payloads
* invalid image encoding
* invalid websocket events
* unsupported event types

---

# Error Handling

All failures MUST:

* fail safely
* avoid crashing websocket threads
* return normalized error payloads

---

# Observability

Backend MUST expose:

* websocket latency
* active sessions
* dropped frames
* AI latency
* reconnect count
* websocket errors

---

# Logging Rules

Realtime logs MUST:

* avoid excessive verbosity
* avoid logging raw images
* avoid blocking operations

---

# Security Rules

Backend MUST:

* validate all websocket payloads
* enforce payload limits
* sanitize inputs
* support authentication
* support authorization
* prevent abuse

---

# Authentication

Future versions SHOULD support:

* JWT authentication
* websocket auth tokens
* session validation

Initial versions may run without authentication.

---

# Performance Constraints

## WebSocket Latency

Target:

```txt
< 300ms
```

---

## AI Response Time

Target:

```txt
< 250ms
```

---

## Concurrent Sessions

Backend SHOULD support:

```txt
100+ concurrent websocket clients
```

---

# Resilience Rules

Backend MUST:

* survive AI downtime
* reconnect safely
* recover from websocket disconnects
* avoid memory leaks
* avoid blocking calls

---

# Docker Rules

Backend MUST:

* run in Docker
* expose configurable ports
* support environment variables
* support health checks

---

# Environment Variables

Required variables:

```txt
SPRING_PROFILES_ACTIVE
DATABASE_URL
REDIS_URL
AI_SERVICE_URL
WEBSOCKET_MAX_PAYLOAD_SIZE
```

---

# Testing Rules

Backend MUST include:

* unit tests
* websocket tests
* integration tests
* validation tests

---

# Definition of Done

A backend feature is complete only if:

* follows websocket contracts
* avoids blocking operations
* validates payloads
* handles errors safely
* exposes metrics
* passes tests
* supports realtime safety

---

# Future Improvements

Future backend versions may include:

* distributed websocket clusters
* Kafka streaming
* gRPC inference
* edge inference orchestration
* event sourcing
* distributed tracing

---

# Source of Truth

All backend implementations MUST follow:

* docs/sdd/02-backend.md
* docs/sdd/04-websocket-contracts.md
* root CLAUDE.md
