import { UserStatus, VerificationStatus, TripStatus, RideType, BookingCategory, PaymentMethod, DriverStatus } from './enums';

export interface User {
  id: string;
  phone: string;
  identityId: string | null;
  roles: string[];
  status: UserStatus;
  preferredLocale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Identity {
  id: string;
  passportNumberHash: string;
  passportSeries: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
}

export interface Trip {
  id: string;
  passengerId: string;
  driverId: string | null;
  status: TripStatus;
  rideType: RideType;
  bookingCategory: BookingCategory;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationAddress: string | null;
  fixedPriceUzs: number | null;
  offeredPriceUzs: number | null;
  finalPriceUzs: number | null;
  fareBreakdown: FareBreakdown | null;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface FareBreakdown {
  baseFareUzs: number;
  distanceUzs: number;
  timeUzs: number;
  trafficMultiplier: number;
  peakMultiplier: number;
  nightMultiplier: number;
  waitingUzs: number;
  airportFeeUzs: number;
  tollUzs: number;
  promoDiscountUzs: number;
  commissionUzs: number;
  totalUzs: number;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleId: string | null;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteEstimate {
  distanceM: number;
  durationS: number;
  polyline: string;
  trafficMultiplier: number;
}

export interface FareEstimate {
  totalUzs: number;
  breakdown: FareBreakdown;
  currency: 'UZS';
}

export interface JwtPayload {
  sub: string;
  phone: string;
  roles: string[];
  status: UserStatus;
  identityId: string | null;
}
