import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RequireKyc } from '@taxi/common';
import {
  RideType,
  BookingCategory,
  PaymentMethod,
  TripStatus,
  GeoPoint,
} from '@taxi/database';
import { EventBusService, EventType } from '@taxi/events';
import { FareCalculatorService } from './fare-calculator.service';
import { DriverMatchingService } from './driver-matching.service';
import { TripStateMachine } from '../domain/trip-state-machine';
import { TripRepository } from '../infrastructure/trip.repository';

export interface CreateRideDto {
  pickup: GeoPoint & { address: string };
  destination?: GeoPoint & { address: string };
  category: BookingCategory;
  rideType: RideType;
  paymentMethod: PaymentMethod;
  offeredPriceUzs?: number;
}

@Injectable()
export class RideService {
  constructor(
    private readonly tripRepo: TripRepository,
    private readonly fareCalculator: FareCalculatorService,
    private readonly driverMatching: DriverMatchingService,
    private readonly stateMachine: TripStateMachine,
    private readonly eventBus: EventBusService,
  ) {}

  async estimate(
    pickup: GeoPoint,
    destination: GeoPoint | null,
    category: BookingCategory,
    rideType: RideType,
    offeredPriceUzs?: number,
  ) {
    return this.fareCalculator.estimate(pickup, destination, category, rideType, 'Tashkent', offeredPriceUzs);
  }

  async createRide(passengerId: string, dto: CreateRideDto) {
    if (dto.rideType === RideType.FIXED && !dto.destination) {
      throw new BadRequestException('Destination required for fixed price rides');
    }
    if (dto.rideType === RideType.OFFER && !dto.destination) {
      throw new BadRequestException('Destination required for offer rides');
    }

    const estimate = await this.fareCalculator.estimate(
      dto.pickup,
      dto.destination ?? null,
      dto.category,
      dto.rideType,
      'Tashkent',
      dto.offeredPriceUzs,
    );

    const trip = await this.tripRepo.create({
      passengerId,
      rideType: dto.rideType,
      category: dto.category,
      pickupLat: dto.pickup.lat,
      pickupLng: dto.pickup.lng,
      pickupAddress: dto.pickup.address,
      destinationLat: dto.destination?.lat,
      destinationLng: dto.destination?.lng,
      destinationAddress: dto.destination?.address,
      fixedPriceUzs: dto.rideType === RideType.FIXED ? estimate.totalUzs : undefined,
      offeredPriceUzs: dto.offeredPriceUzs,
      fareBreakdown: estimate.breakdown,
      paymentMethod: dto.paymentMethod,
    });

    await this.tripRepo.updateStatus(trip.id, TripStatus.REQUESTED, TripStatus.SEARCHING, passengerId);

    const drivers = await this.driverMatching.findNearbyDrivers(
      dto.pickup.lat,
      dto.pickup.lng,
      dto.category,
    );

    await this.eventBus.publish(EventType.TRIP_REQUESTED, {
      tripId: trip.id,
      passengerId,
      pickup: { lat: dto.pickup.lat, lng: dto.pickup.lng, address: dto.pickup.address },
      destination: dto.destination
        ? { lat: dto.destination.lat, lng: dto.destination.lng, address: dto.destination.address }
        : undefined,
      price: estimate.totalUzs,
      category: dto.category,
      rideType: dto.rideType,
      nearbyDriverIds: drivers.map((d) => d.id),
      nearbyDriverUserIds: drivers.map((d) => d.user_id),
    });

    return {
      trip: this.formatTrip(trip),
      estimate,
      nearbyDrivers: drivers.length,
    };
  }

  async getTrip(tripId: string) {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    return this.formatTrip(trip);
  }

  async cancelTrip(tripId: string, userId: string, reason?: string) {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    this.stateMachine.transition(trip.status, TripStatus.CANCELLED);
    const updated = await this.tripRepo.updateStatus(
      tripId,
      trip.status,
      TripStatus.CANCELLED,
      userId,
      { reason },
    );

    await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
      tripId,
      fromStatus: trip.status,
      toStatus: TripStatus.CANCELLED,
      passengerId: trip.passenger_id,
      driverId: trip.driver_id ?? undefined,
    });

    return this.formatTrip(updated);
  }

  async getHistory(passengerId: string) {
    const trips = await this.tripRepo.getPassengerHistory(passengerId);
    return trips.map((t) => this.formatTrip(t));
  }

  private formatTrip(trip: {
    id: string;
    passenger_id: string;
    driver_id: string | null;
    status: TripStatus;
    ride_type: RideType;
    booking_category: BookingCategory;
    pickup_address: string;
    destination_address: string | null;
    fixed_price_uzs: number | null;
    offered_price_uzs: number | null;
    final_price_uzs: number | null;
    fare_breakdown: unknown;
    payment_method: PaymentMethod;
    created_at: Date;
  }) {
    return {
      id: trip.id,
      passengerId: trip.passenger_id,
      driverId: trip.driver_id,
      status: trip.status,
      rideType: trip.ride_type,
      category: trip.booking_category,
      pickupAddress: trip.pickup_address,
      destinationAddress: trip.destination_address,
      fixedPriceUzs: trip.fixed_price_uzs,
      offeredPriceUzs: trip.offered_price_uzs,
      finalPriceUzs: trip.final_price_uzs,
      fareBreakdown: trip.fare_breakdown,
      paymentMethod: trip.payment_method,
      createdAt: trip.created_at,
    };
  }
}
