export const APP_NAME = 'Taxi UZ';
export const DEFAULT_CURRENCY = 'UZS';
export const DEFAULT_LOCALE = 'uz';
export const SUPPORTED_LOCALES = ['uz', 'ru', 'en'] as const;

export const SUPPORTED_CITIES = [
  'Tashkent',
  'Samarkand',
  'Bukhara',
  'Andijan',
  'Namangan',
  'Fergana',
  'Nukus',
] as const;

export const COMMISSION_PERCENT = 15;
export const PLATFORM_MIN_OFFER_PERCENT = 0.5;
export const PLATFORM_MAX_OFFER_PERCENT = 3.0;

export const RATE_LIMIT = {
  OTP_SEND: { ttl: 60, limit: 3 },
  OTP_VERIFY: { ttl: 300, limit: 5 },
  API_DEFAULT: { ttl: 60, limit: 100 },
};

export const KYC = {
  FACE_MATCH_THRESHOLD: 0.85,
  LIVENESS_THRESHOLD: 0.90,
  MAX_DOCUMENT_SIZE_MB: 10,
};

export const REALTIME = {
  DRIVER_LOCATION_INTERVAL_MS: 3000,
  ETA_UPDATE_INTERVAL_MS: 5000,
  DRIVER_SEARCH_RADIUS_M: 5000,
};
