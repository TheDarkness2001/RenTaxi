# Taxi UZ — Nationwide Super App Platform

Production-grade taxi platform for Uzbekistan. Built for millions of users, real-time GPS, dynamic pricing, mandatory KYC, and multiple ride models.

## Applications

| App | Stack | Port |
|-----|-------|------|
| API Gateway | NestJS | 3000 |
| Auth Service | NestJS | 3001 |
| Identity / KYC Service | NestJS | 3002 |
| Ride Service | NestJS | 3003 |
| Payment Service | NestJS | 3004 |
| Location Service | NestJS | 3005 |
| Notification Service | NestJS | 3006 |
| Admin Dashboard | React + TypeScript | 5173 |
| Passenger App | Flutter | — |
| Driver App | Flutter | — |

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../admin && npm install

# 2. Copy environment
cp .env.example .env

# 3. Start infrastructure (PostgreSQL+PostGIS, Redis, RabbitMQ, MinIO)
docker compose up -d

# 4. Start all backend services
cd backend && npm run dev:all

# 5. Admin panel (separate terminal)
cd admin && npm run dev

# 6. Flutter passenger app
cd mobile/passenger_app && flutter pub get && flutter run
```

## Core Principles

- **Identity = Passport** (NOT SIM card)
- **One person = One account** (passenger + driver modes allowed on same account)
- **KYC mandatory** before full platform access
- **Real-time GPS** is non-negotiable
- **Safety > convenience**
- **Fraud prevention built-in**

## Ride Models

1. **Fixed Price** — price locked before booking
2. **Go Around (Meter)** — dynamic fare by GPS distance + time
3. **Offer Your Price** — market-based negotiation (inDrive-style)

## Tech Stack

- **Backend:** Node.js, NestJS, Clean Architecture
- **Database:** PostgreSQL + PostGIS
- **Cache/Queue:** Redis, RabbitMQ
- **Real-time:** Socket.IO
- **Mobile:** Flutter
- **Admin:** React + TypeScript
- **Maps:** Google Maps / Mapbox
- **Payments:** Click, Payme, Uzum, Visa/MC, Cash
- **Notifications:** Firebase Cloud Messaging

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Reference](./docs/API.md)

## Localization

- Languages: Uzbek, Russian, English
- Currency: UZS
- Cities: Tashkent, Samarkand, Bukhara, Andijan, Namangan, Fergana, Nukus

## License

Proprietary — All rights reserved.
