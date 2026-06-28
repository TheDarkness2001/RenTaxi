# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│ Passenger    │ Driver       │ Admin        │ WebSocket Clients         │
│ Flutter App  │ Flutter App  │ React Panel  │ (real-time tracking)      │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────────┬─────────────┘
       │              │              │                     │
       └──────────────┴──────────────┴─────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │    API Gateway    │
                          │  (Rate Limit, JWT)│
                          └─────────┬─────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │              │             │             │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Auth        │ │ Identity  │ │ Ride      │ │ Payment   │ │ Location  │
│ Service     │ │ / KYC     │ │ Service   │ │ Service   │ │ Service   │
└──────┬──────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
       │              │             │             │              │
       └──────────────┴─────────────┴─────────────┴──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐      ┌───────▼───────┐     ┌───────▼───────┐
       │ PostgreSQL  │      │ Redis         │     │ RabbitMQ      │
       │ + PostGIS   │      │ Cache/Session │     │ Event Bus     │
       └─────────────┘      └───────────────┘     └───────────────┘
```

## Microservices

### 1. API Gateway (`:3000`)
- Single entry point for all clients
- JWT validation, rate limiting, request routing
- WebSocket proxy for real-time events
- API versioning (`/v1/`)

### 2. Auth Service (`:3001`)
- Phone + OTP login (SIM is NOT identity)
- JWT access + refresh token rotation
- Device fingerprinting
- Session management via Redis

### 3. Identity / KYC Service (`:3002`) — CRITICAL
- Passport OCR (front/back)
- Live selfie + liveness detection
- Face match: selfie ↔ passport photo
- Anti-spoofing (photo/video attack detection)
- **One passport = one account** enforcement
- Unique `identity_id` assignment
- Driver document verification (license, registration, insurance)

### 4. Ride Service (`:3003`)
- Trip lifecycle state machine
- Fixed price / meter / offer-your-price modes
- Driver matching & allocation
- Fare calculation engine
- Rating system

### 5. Payment Service (`:3004`)
- Click, Payme, Uzum integrations
- Visa/Mastercard, Apple Pay, Google Pay
- Cash payments, wallet, split payments
- Driver earnings, refunds, corporate billing

### 6. Location Service (`:3005`)
- Real-time GPS ingestion (300ms target)
- PostGIS geospatial queries
- Driver proximity search
- Route calculation, ETA prediction
- Fake GPS detection

### 7. Notification Service (`:3006`)
- Firebase Cloud Messaging
- SMS OTP delivery
- In-app notifications
- Push for trip status changes

## Clean Architecture (per service)

```
src/
├── domain/           # Entities, value objects, domain events
├── application/      # Use cases, DTOs, ports (interfaces)
├── infrastructure/   # DB repos, external APIs, message queues
└── presentation/     # Controllers, gateways, guards
```

## Identity Flow (Mandatory KYC)

```
Phone OTP Login
      │
      ▼
Account Created (limited access)
      │
      ▼
Upload Passport (front + back)
      │
      ▼
OCR Extraction ──► Validate passport uniqueness
      │
      ▼
Live Selfie + Liveness Check
      │
      ▼
Face Match (selfie ↔ passport photo)
      │
      ├── Match + Unique ──► identity_id assigned ──► Full access
      │
      └── Duplicate passport/face ──► BLOCK (one person = one account)
```

## Trip Lifecycle

```
REQUESTED → SEARCHING → DRIVER_ASSIGNED → DRIVER_ARRIVING
    → PICKED_UP → IN_PROGRESS → COMPLETED → PAYMENT_PROCESSING
    → PAID → RATED
```

## Event-Driven Communication

Services communicate via RabbitMQ events:

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `user.registered` | Auth | Identity, Notification |
| `identity.verified` | Identity | Auth, Ride |
| `trip.requested` | Ride | Location, Notification |
| `trip.status_changed` | Ride | Notification, Payment, Location |
| `driver.location_updated` | Location | Ride, Notification |
| `payment.completed` | Payment | Ride, Notification |

## Real-Time Layer

Socket.IO namespaces:
- `/trips` — trip status, driver location, ETA
- `/drivers` — driver online status, new ride offers
- `/admin` — live map, fleet monitoring

## Security

- JWT + refresh token rotation
- Rate limiting (Redis sliding window)
- Encrypted PII at rest (AES-256)
- Audit logs for all sensitive operations
- Device fingerprinting + bot detection
- Fake GPS detection (speed/jump analysis)

## Scaling Strategy

- Horizontal pod autoscaling (Kubernetes)
- Read replicas for PostgreSQL
- Redis cluster for sessions/cache
- RabbitMQ cluster for events
- CDN for static assets
- PostGIS spatial indexes for driver search

## Performance Targets

| Metric | Target |
|--------|--------|
| App startup | < 2s |
| Real-time updates | < 300ms |
| API response (p95) | < 200ms |
| Uptime | 99.99% |

## Deployment

```
infrastructure/k8s/
├── namespaces/
├── api-gateway/
├── auth-service/
├── identity-service/
├── ride-service/
├── payment-service/
├── location-service/
├── notification-service/
├── postgresql/
├── redis/
└── rabbitmq/
```
