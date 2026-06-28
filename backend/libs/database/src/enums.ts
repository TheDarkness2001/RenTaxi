export enum UserStatus {
  PENDING_KYC = 'pending_kyc',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum TripStatus {
  REQUESTED = 'requested',
  SEARCHING = 'searching',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_ARRIVING = 'driver_arriving',
  PICKED_UP = 'picked_up',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAYMENT_PROCESSING = 'payment_processing',
  PAID = 'paid',
  RATED = 'rated',
  CANCELLED = 'cancelled',
}

export enum RideType {
  FIXED = 'fixed',
  METER = 'meter',
  OFFER = 'offer',
}

export enum BookingCategory {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  XL = 'xl',
  ELECTRIC = 'electric',
  FEMALE_DRIVER = 'female_driver',
  PET_FRIENDLY = 'pet_friendly',
  MOTORCYCLE = 'motorcycle',
  COURIER = 'courier',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
  CLICK = 'click',
  PAYME = 'payme',
  UZUM = 'uzum',
}

export enum DriverStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum DocumentType {
  PASSPORT_FRONT = 'passport_front',
  PASSPORT_BACK = 'passport_back',
  SELFIE = 'selfie',
  DRIVER_LICENSE = 'driver_license',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  INSURANCE = 'insurance',
}

export const VALID_TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.REQUESTED]: [TripStatus.SEARCHING, TripStatus.CANCELLED],
  [TripStatus.SEARCHING]: [TripStatus.DRIVER_ASSIGNED, TripStatus.CANCELLED],
  [TripStatus.DRIVER_ASSIGNED]: [TripStatus.DRIVER_ARRIVING, TripStatus.CANCELLED],
  [TripStatus.DRIVER_ARRIVING]: [TripStatus.PICKED_UP, TripStatus.CANCELLED],
  [TripStatus.PICKED_UP]: [TripStatus.IN_PROGRESS],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [TripStatus.PAYMENT_PROCESSING],
  [TripStatus.PAYMENT_PROCESSING]: [TripStatus.PAID, TripStatus.CANCELLED],
  [TripStatus.PAID]: [TripStatus.RATED],
  [TripStatus.RATED]: [],
  [TripStatus.CANCELLED]: [],
};
