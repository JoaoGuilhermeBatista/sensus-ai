# SDD 06 — Deployment

# Purpose

This document defines deployment architecture, infrastructure rules, containerization, networking, observability, and production deployment strategy for Sensus AI.

The deployment architecture MUST support:

* local development
* realtime websocket communication
* GPU inference workloads
* containerized services
* scalable infrastructure
* observability
* production deployment

---

# Deployment Philosophy

The platform follows:

```txt
Container-first deployment architecture
```

All services MUST run inside containers.

---

# Deployment Targets

The platform MUST support:

* local Docker deployment
* cloud deployment
* GPU-enabled deployment
* scalable backend deployment

---

# Infrastructure Overview

## Services

The platform consists of:

```txt
frontend-xr
backend-api
ia-service
postgres
redis
```

---

# Monorepo Structure

Infrastructure files SHOULD remain inside:

```txt
infra/
```

Recommended structure:

```txt
infra/
├── docker/
├── nginx/
├── k8s/
├── terraform/
└── scripts/
```

---

# Docker Compose

## Local Development

Local development MUST use:

```txt
docker compose
```

---

# Root Compose File

Main compose file:

```txt
docker-compose.yml
```

located at monorepo root.

---

# Container Rules

All services MUST:

* run in isolated containers
* expose health checks
* support environment variables
* support restart policies
* support structured logs

---

# Frontend Deployment

## Responsibilities

Frontend container MUST:

* serve React application
* support WebSocket connections
* support mobile browsers
* support Quest browser

---

## Frontend Port

Default:

```txt
5173
```

---

## Frontend Environment Variables

Required variables:

```txt
VITE_BACKEND_WS_URL
VITE_API_URL
VITE_ENABLE_XR
```

---

# Backend Deployment

## Responsibilities

Backend container MUST:

* expose REST API
* expose websocket gateway
* integrate Redis
* integrate PostgreSQL
* integrate AI service

---

## Backend Port

Default:

```txt
8080
```

---

## Backend Environment Variables

Required variables:

```txt
SPRING_PROFILES_ACTIVE
DATABASE_URL
REDIS_URL
AI_SERVICE_URL
WEBSOCKET_MAX_PAYLOAD_SIZE
```

---

# AI Service Deployment

## Responsibilities

AI container MUST:

* expose inference API
* support GPU runtime
* support model loading
* expose health checks

---

## AI Service Port

Default:

```txt
8000
```

---

## AI Environment Variables

Required variables:

```txt
MODEL_PATH
CONFIDENCE_THRESHOLD
DEVICE
LOG_LEVEL
```

---

# GPU Deployment

The AI service SHOULD support:

```txt
NVIDIA Container Toolkit
```

---

# GPU Rules

GPU deployments MUST:

* expose GPU metrics
* support CPU fallback
* avoid VRAM exhaustion
* support configurable devices

---

# Redis Deployment

## Responsibilities

Redis MUST support:

* websocket scaling
* rate limiting
* realtime caching
* distributed state

---

## Redis Port

Default:

```txt
6379
```

---

# PostgreSQL Deployment

## Responsibilities

PostgreSQL MAY store:

* analytics
* sessions
* metrics
* historical detections

---

## PostgreSQL Port

Default:

```txt
5432
```

---

# Networking Rules

All services MUST communicate using:

```txt
internal Docker networks
```

---

# Service Discovery

Containers SHOULD communicate using:

```txt
service names
```

Example:

```txt
http://backend-api:8080
http://ia-service:8000
```

---

# Health Checks

All services MUST expose:

```txt
health endpoints
```

---

# Required Health Endpoints

## Backend

```txt
GET /api/health
```

---

## AI Service

```txt
GET /health
```

---

# Restart Policies

Containers SHOULD use:

```txt
restart: unless-stopped
```

---

# Logging Rules

All containers MUST:

* use structured logs
* avoid logging image payloads
* expose error logs
* expose metrics

---

# Observability

The platform MUST expose:

* websocket metrics
* inference metrics
* FPS metrics
* reconnect metrics
* container health
* GPU metrics

---

# Metrics Stack

Future versions MAY support:

* Prometheus
* Grafana
* Loki
* OpenTelemetry

---

# NGINX

Future production deployments MAY use:

```txt
NGINX reverse proxy
```

Responsibilities:

* SSL termination
* websocket proxying
* load balancing
* compression

---

# CI/CD

The platform SHOULD support:

* GitHub Actions
* automated builds
* automated tests
* automated linting
* Docker image publishing

---

# CI Pipeline Rules

CI MUST:

* run tests
* run lint
* validate contracts
* build containers
* validate Docker images

---

# Kubernetes

Future deployments MAY support:

* Kubernetes
* horizontal scaling
* GPU node scheduling
* autoscaling

---

# Secrets Management

Sensitive data MUST:

* use environment variables
* avoid Git commits
* avoid hardcoded credentials

---

# Security Rules

Containers MUST:

* avoid privileged execution
* expose minimal ports
* validate external payloads
* avoid filesystem exposure

---

# Volume Rules

Persistent volumes MAY be used for:

* PostgreSQL data
* model storage
* logs
* metrics

---

# Model Storage Rules

AI models MUST:

* remain outside Git
* support mounted volumes
* support external downloads

---

# Scalability Goals

The infrastructure SHOULD support:

```txt
100+ concurrent websocket users
```

---

# Production Goals

Production deployments SHOULD support:

* HTTPS
* secure websocket connections
* scalable inference
* autoscaling
* observability
* fault tolerance

---

# Local Development Goals

Local setup MUST:

* work with a single docker compose command
* support hot reload where possible
* support isolated services
* support reproducible environments

---

# Required Commands

## Local Development

```bash
docker compose up
```

---

## Detached Mode

```bash
docker compose up -d
```

---

## Shutdown

```bash
docker compose down
```

---

# Testing Rules

Deployment MUST support:

* integration tests
* websocket tests
* container health validation
* GPU validation

---

# Disaster Recovery

The platform SHOULD:

* recover after container crashes
* restart failed services
* survive websocket reconnect storms

---

# Future Improvements

Future deployment improvements may include:

* edge inference nodes
* distributed websocket clusters
* CDN optimization
* GPU autoscaling
* multi-region deployment

---

# Definition of Done

A deployment feature is complete only if:

* containers build successfully
* services communicate correctly
* health checks pass
* websocket connections work
* GPU support works
* environment variables are configurable
* logs are exposed correctly

---

# Source of Truth

All deployment implementations MUST follow:

* docs/sdd/06-deployment.md
* docs/sdd/05-realtime-rules.md
* root CLAUDE.md
