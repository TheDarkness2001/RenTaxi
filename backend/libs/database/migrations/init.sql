-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE user_status AS ENUM ('pending_kyc', 'active', 'suspended', 'banned');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE document_type AS ENUM (
  'passport_front', 'passport_back', 'selfie',
  'driver_license', 'vehicle_registration', 'insurance'
);
CREATE TYPE driver_status AS ENUM ('pending_approval', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_category AS ENUM (
  'economy', 'comfort', 'premium', 'xl', 'electric',
  'female_driver', 'pet_friendly', 'motorcycle', 'courier'
);
CREATE TYPE ride_type AS ENUM ('fixed', 'meter', 'offer');
CREATE TYPE trip_status AS ENUM (
  'requested', 'searching', 'driver_assigned', 'driver_arriving',
  'picked_up', 'in_progress', 'completed', 'payment_processing',
  'paid', 'rated', 'cancelled'
);
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet', 'click', 'payme', 'uzum');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE wallet_type AS ENUM ('passenger', 'driver_earnings');
CREATE TYPE location_label AS ENUM ('home', 'work', 'custom');

-- Identities (one person = one identity)
CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_number_hash VARCHAR(64) NOT NULL UNIQUE,
  passport_series VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(3) DEFAULT 'UZB',
  face_embedding_hash VARCHAR(64),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (login account linked to identity after KYC)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  identity_id UUID REFERENCES identities(id),
  roles TEXT[] NOT NULL DEFAULT '{passenger}',
  status user_status NOT NULL DEFAULT 'pending_kyc',
  preferred_locale VARCHAR(5) NOT NULL DEFAULT 'uz',
  device_fingerprint VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_identity ON users(identity_id);
CREATE INDEX idx_users_status ON users(status);

-- Identity documents
CREATE TABLE identity_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES identities(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type document_type NOT NULL,
  storage_url TEXT NOT NULL,
  ocr_data JSONB,
  liveness_score DECIMAL(4,3),
  face_match_score DECIMAL(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_docs_user ON identity_documents(user_id);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  device_id VARCHAR(128),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30) NOT NULL,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  category booking_category NOT NULL DEFAULT 'economy',
  is_pet_friendly BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  status driver_status NOT NULL DEFAULT 'pending_approval',
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_trips INTEGER NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  current_location GEOGRAPHY(POINT, 4326),
  current_heading SMALLINT,
  last_location_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_drivers_online ON drivers(is_online) WHERE is_online = TRUE;

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  status trip_status NOT NULL DEFAULT 'requested',
  ride_type ride_type NOT NULL,
  booking_category booking_category NOT NULL DEFAULT 'economy',
  pickup GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination GEOGRAPHY(POINT, 4326),
  destination_address TEXT,
  route_polyline TEXT,
  estimated_distance_m INTEGER,
  estimated_duration_s INTEGER,
  actual_distance_m INTEGER,
  actual_duration_s INTEGER,
  fixed_price_uzs BIGINT,
  offered_price_uzs BIGINT,
  final_price_uzs BIGINT,
  fare_breakdown JSONB,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  promo_code_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_passenger ON trips(passenger_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_pickup ON trips USING GIST (pickup);

-- Trip events (audit trail)
CREATE TABLE trip_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  from_status trip_status,
  to_status trip_status NOT NULL,
  actor_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_events_trip ON trip_events(trip_id);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  balance_uzs BIGINT NOT NULL DEFAULT 0,
  type wallet_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_uzs BIGINT NOT NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  provider_transaction_id VARCHAR(128),
  commission_uzs BIGINT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_trip ON payments(trip_id);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  rater_id UUID NOT NULL REFERENCES users(id),
  rated_id UUID NOT NULL REFERENCES users(id),
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, rater_id)
);

-- Promo codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed_uzs')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  city VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved locations
CREATE TABLE saved_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  label location_label NOT NULL,
  name VARCHAR(100),
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_locations_user ON saved_locations(user_id);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Pricing config per city
CREATE TABLE pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(50) NOT NULL,
  category booking_category NOT NULL,
  base_fare_uzs BIGINT NOT NULL,
  per_km_uzs BIGINT NOT NULL,
  per_minute_uzs BIGINT NOT NULL,
  min_fare_uzs BIGINT NOT NULL,
  night_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  peak_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  commission_percent DECIMAL(4,2) NOT NULL DEFAULT 15.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city, category)
);

-- Seed Tashkent pricing
INSERT INTO pricing_config (city, category, base_fare_uzs, per_km_uzs, per_minute_uzs, min_fare_uzs, night_multiplier, peak_multiplier) VALUES
  ('Tashkent', 'economy', 5000, 2500, 500, 8000, 1.3, 1.5),
  ('Tashkent', 'comfort', 8000, 3500, 700, 12000, 1.3, 1.5),
  ('Tashkent', 'premium', 15000, 5000, 1000, 20000, 1.4, 1.6),
  ('Tashkent', 'xl', 12000, 4000, 800, 15000, 1.3, 1.5),
  ('Tashkent', 'electric', 6000, 2800, 550, 9000, 1.2, 1.4);
