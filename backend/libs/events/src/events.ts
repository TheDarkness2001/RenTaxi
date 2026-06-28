export enum EventType {
  USER_REGISTERED = 'user.registered',
  IDENTITY_VERIFIED = 'identity.verified',
  IDENTITY_REJECTED = 'identity.rejected',
  TRIP_REQUESTED = 'trip.requested',
  TRIP_STATUS_CHANGED = 'trip.status_changed',
  DRIVER_LOCATION_UPDATED = 'driver.location_updated',
  PAYMENT_COMPLETED = 'payment.completed',
  DRIVER_APPROVED = 'driver.approved',
  TRIP_OFFER_DECLINED = 'trip.offer_declined',
}

export interface BaseEvent<T = unknown> {
  type: EventType;
  timestamp: string;
  payload: T;
}

export interface UserRegisteredPayload {
  userId: string;
  phone: string;
}

export interface IdentityVerifiedPayload {
  userId: string;
  identityId: string;
}

export interface TripStatusChangedPayload {
  tripId: string;
  fromStatus: string;
  toStatus: string;
  passengerId: string;
  driverId?: string;
}

export interface TripRequestedPayload {
  tripId: string;
  passengerId: string;
  pickup: { lat: number; lng: number; address: string };
  destination?: { lat: number; lng: number; address: string };
  price: number;
  category: string;
  rideType: string;
  nearbyDriverIds: string[];
  nearbyDriverUserIds: string[];
}

export interface DriverLocationPayload {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
}

export interface PaymentCompletedPayload {
  tripId: string;
  paymentId: string;
  amountUzs: number;
  method: string;
  userId: string;
}
