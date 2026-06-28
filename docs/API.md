# API Reference (v1)

Base URL: `https://api.taxi.uz/v1`

All authenticated endpoints require: `Authorization: Bearer <access_token>`

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send OTP to phone number |
| POST | `/auth/otp/verify` | Verify OTP, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Current user profile |

### POST /auth/otp/send
```json
{ "phone": "+998901234567", "locale": "uz" }
```

### POST /auth/otp/verify
```json
{ "phone": "+998901234567", "code": "123456", "device_id": "uuid" }
```
Response includes `access_token`, `refresh_token`, `user.status` (`pending_kyc` or `active`).

## Identity / KYC

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/identity/documents` | Upload KYC document |
| POST | `/identity/verify` | Submit for verification |
| GET | `/identity/status` | Check verification status |
| POST | `/identity/driver/documents` | Upload driver documents |
| POST | `/identity/driver/apply` | Apply for driver mode |

### POST /identity/documents
Multipart: `type` (passport_front|passport_back|selfie), `file`

### POST /identity/verify
Triggers OCR → face match → liveness → uniqueness check.

## Rides

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rides/estimate` | Get fare estimate (fixed mode) |
| POST | `/rides` | Create ride request |
| GET | `/rides/:id` | Trip details |
| PATCH | `/rides/:id/cancel` | Cancel trip |
| POST | `/rides/:id/rate` | Rate completed trip |
| GET | `/rides/history` | Ride history |
| POST | `/rides/offer` | Create offer-your-price ride |
| PATCH | `/rides/:id/offer/respond` | Driver accept/reject offer |

### POST /rides/estimate
```json
{
  "pickup": { "lat": 41.2995, "lng": 69.2401 },
  "destination": { "lat": 41.3111, "lng": 69.2797 },
  "category": "economy",
  "ride_type": "fixed"
}
```

### POST /rides
```json
{
  "pickup": { "lat": 41.2995, "lng": 69.2401, "address": "Amir Temur ko'chasi" },
  "destination": { "lat": 41.3111, "lng": 69.2797, "address": "Toshkent shahar" },
  "category": "economy",
  "ride_type": "fixed",
  "payment_method": "cash"
}
```

## Drivers

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/drivers/status` | Go online/offline |
| GET | `/drivers/earnings` | Earnings dashboard |
| GET | `/drivers/heatmap` | Demand heatmap |
| PATCH | `/drivers/location` | Update GPS location |
| GET | `/drivers/trips/active` | Current active trip |
| PATCH | `/drivers/trips/:id/status` | Update trip status |

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/process` | Process trip payment |
| GET | `/payments/wallet` | Wallet balance |
| POST | `/payments/wallet/topup` | Top up wallet |
| POST | `/payments/refund` | Request refund |
| GET | `/payments/history` | Payment history |

## Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/location/route` | Route preview + ETA |
| GET | `/location/nearby-drivers` | Nearby available drivers |

## Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Analytics overview |
| GET | `/admin/trips/live` | Live trip monitoring |
| GET | `/admin/drivers/map` | Live driver map |
| PATCH | `/admin/users/:id/status` | Suspend/ban user |
| PATCH | `/admin/drivers/:id/approve` | Approve driver |
| GET | `/admin/fraud/alerts` | Fraud detection panel |
| POST | `/admin/refunds/:id/approve` | Approve refund |

## WebSocket Events

Connect: `wss://api.taxi.uz/socket.io`

### Namespace: `/trips`
| Event | Direction | Payload |
|-------|-----------|---------|
| `trip:status` | Server → Client | `{ tripId, status, eta }` |
| `trip:driver_location` | Server → Client | `{ tripId, lat, lng, heading }` |
| `trip:offer_received` | Server → Driver | `{ tripId, pickup, price, distance }` |

### Namespace: `/drivers`
| Event | Direction | Payload |
|-------|-----------|---------|
| `driver:location` | Client → Server | `{ lat, lng, heading, speed }` |
| `driver:new_ride` | Server → Client | Ride offer payload |

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_OTP` | 401 | Wrong or expired OTP |
| `IDENTITY_DUPLICATE_PASSPORT` | 409 | Passport already registered |
| `IDENTITY_DUPLICATE_FACE` | 409 | Face already registered |
| `IDENTITY_KYC_REQUIRED` | 403 | KYC not completed |
| `RIDE_NO_DRIVERS` | 404 | No drivers available |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
