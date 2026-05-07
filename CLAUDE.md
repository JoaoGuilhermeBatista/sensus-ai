# CLAUDE.md

## Project Overview

Sensus AI is a realtime assistive vision platform using:

- Frontend: React + WebXR + TypeScript
- Backend: Spring Boot + WebSocket + WebFlux
- AI Service: FastAPI + YOLOv8
- Communication: WebSocket + REST
- Database: PostgreSQL
- Cache/Realtime: Redis

The project follows Spec Driven Development.

All implementations MUST follow:
- docs/sdd/*
- shared contracts
- realtime constraints
- accessibility rules
- performance constraints

---

## Monorepo Structure

apps/
  frontend-xr/
  backend-api/
  ia-service/

packages/
  shared-contracts/

docs/
  sdd/

---

## Global Rules

- Never create duplicated DTOs
- Always use shared contracts
- WebSocket payloads must be versioned
- Realtime performance is mandatory
- Mobile-first and XR-first architecture
- Accessibility is non-negotiable

---

## Branch Rules

- One feature per branch
- Small incremental changes
- No massive rewrites

---

## Commit Convention

feat(scope):
fix(scope):
refactor(scope):
chore(scope):
docs(scope):

---

## Performance Constraints

- Max websocket latency: 300ms
- Minimum FPS: 5
- Max frame size: 500KB
- No blocking operations in realtime flow

---

## Definition of Done

A feature is only complete when:
- follows SDD
- follows contracts
- has error handling
- has loading states
- has realtime safety
- passes lint/typecheck/tests