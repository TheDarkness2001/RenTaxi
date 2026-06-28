# Database Schema

PostgreSQL 16 + PostGIS 3.4

## Core Tables

### users
Central account table. One person = one row.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| phone | VARCHAR(20) UNIQUE | Login identifier (NOT identity) |
| identity_id | UUID UNIQUE FK | Set after KYC approval |
| roles | TEXT[] | `passenger`, `driver`, `admin` |
| status | ENUM | `pending_kyc`, `active`, `suspended`, `banned` |
| preferred_locale | VARCHAR(5) | `uz`, `ru`, `en` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### identities
One row per verified person. Enforces one-person-one-account.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `identity_id` |
| passport_number_hash | VARCHAR(64) UNIQUE | SHA-256 of passport number |
| passport_series | VARCHAR(10) | |
| first_name | VARCHAR(100) | From OCR |
| last_name | VARCHAR(100) | From OCR |
| date_of_birth | DATE | From OCR |
| nationality | VARCHAR(3) | ISO 3166 |
| face_embedding | VECTOR(512) | For duplicate face detection |
| verification_status | ENUM | `pending`, `verified`, `rejected` |
| verified_at | TIMESTAMPTZ | |

### identity_documents
Uploaded KYC documents.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| identity_id | UUID FK | |
| type | ENUM | `passport_front`, `passport_back`, `selfie`, `driver_license`, `vehicle_registration`, `insurance` |
| storage_url | TEXT | S3/MinIO path |
| ocr_data | JSONB | Extracted fields |
| liveness_score | DECIMAL | 0.0–1.0 |
| face_match_score | DECIMAL | 0.0–1.0 |

### drivers
Driver profile linked to user account.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK UNIQUE | Same identity, driver mode |
| status | ENUM | `pending_approval`, `approved`, `rejected`, `suspended` |
| rating | DECIMAL(3,2) | 1.00–5.00 |
| total_trips | INTEGER | |
| is_online | BOOLEAN | |
| current_location | GEOGRAPHY(POINT) | PostGIS |
| vehicle_id | UUID FK | |

### vehicles

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| driver_id | UUID FK | |
| make | VARCHAR(50) | |
| model | VARCHAR(50) | |
| year | INTEGER | |
| color | VARCHAR(30) | |
| plate_number | VARCHAR(20) UNIQUE | |
| category | ENUM | `economy`, `comfort`, `premium`, `xl`, `electric`, `motorcycle` |
| is_pet_friendly | BOOLEAN | |
| is_female_driver | BOOLEAN | |

### trips

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| passenger_id | UUID FK | |
| driver_id | UUID FK NULL | |
| status | ENUM | Full lifecycle |
| ride_type | ENUM | `fixed`, `meter`, `offer` |
| booking_category | ENUM | Vehicle category |
| pickup | GEOGRAPHY(POINT) | |
| pickup_address | TEXT | |
| destination | GEOGRAPHY(POINT) NULL | NULL for meter mode |
| destination_address | TEXT | |
| route_polyline | TEXT | Encoded polyline |
| estimated_distance_m | INTEGER | |
| estimated_duration_s | INTEGER | |
| fixed_price_uzs | BIGINT NULL | Locked for fixed/offer |
| final_price_uzs | BIGINT NULL | Set on completion |
| offered_price_uzs | BIGINT NULL | Offer-your-price mode |
| fare_breakdown | JSONB | Base, distance, time, surcharges |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

### trip_events
Audit trail for trip state changes.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| trip_id | UUID FK | |
| from_status | ENUM | |
| to_status | ENUM | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

### payments

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| trip_id | UUID FK | |
| amount_uzs | BIGINT | |
| method | ENUM | `cash`, `card`, `wallet`, `click`, `payme`, `uzum` |
| status | ENUM | `pending`, `processing`, `completed`, `failed`, `refunded` |
| provider_transaction_id | VARCHAR | |
| commission_uzs | BIGINT | Platform cut |

### wallets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| balance_uzs | BIGINT | |
| type | ENUM | `passenger`, `driver_earnings` |

### ratings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| trip_id | UUID FK | |
| rater_id | UUID FK | |
| rated_id | UUID FK | |
| score | SMALLINT | 1–5 |
| comment | TEXT | |

### promo_codes

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | VARCHAR(20) UNIQUE | |
| discount_type | ENUM | `percent`, `fixed_uzs` |
| discount_value | INTEGER | |
| max_uses | INTEGER | |
| used_count | INTEGER | |
| valid_from | TIMESTAMPTZ | |
| valid_until | TIMESTAMPTZ | |
| city | VARCHAR(50) NULL | City-specific |

### saved_locations

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| label | ENUM | `home`, `work`, `custom` |
| address | TEXT | |
| location | GEOGRAPHY(POINT) | |

## Spatial Indexes

```sql
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_trips_pickup ON trips USING GIST (pickup);
CREATE INDEX idx_trips_destination ON trips USING GIST (destination);
```

## Enums

```sql
CREATE TYPE user_status AS ENUM ('pending_kyc', 'active', 'suspended', 'banned');
CREATE TYPE trip_status AS ENUM (
  'requested', 'searching', 'driver_assigned', 'driver_arriving',
  'picked_up', 'in_progress', 'completed', 'payment_processing',
  'paid', 'rated', 'cancelled'
);
CREATE TYPE ride_type AS ENUM ('fixed', 'meter', 'offer');
CREATE TYPE booking_category AS ENUM (
  'economy', 'comfort', 'premium', 'xl', 'electric',
  'female_driver', 'pet_friendly', 'motorcycle', 'courier'
);
```
