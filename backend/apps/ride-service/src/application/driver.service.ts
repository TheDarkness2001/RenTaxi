import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { TripStatus } from '@taxi/database';
import { DatabaseService } from '@taxi/database';
import { EventBusService, EventType } from '@taxi/events';
import { DriverRepository } from '../infrastructure/driver.repository';
import { TripStateMachine } from '../domain/trip-state-machine';

const DRIVER_TRANSITIONS: Partial<Record<TripStatus, TripStatus>> = {
  [TripStatus.DRIVER_ASSIGNED]: TripStatus.DRIVER_ARRIVING,
  [TripStatus.DRIVER_ARRIVING]: TripStatus.PICKED_UP,
  [TripStatus.PICKED_UP]: TripStatus.IN_PROGRESS,
  [TripStatus.IN_PROGRESS]: TripStatus.COMPLETED,
};

@Injectable()
export class DriverService {
  constructor(
    private readonly driverRepo: DriverRepository,
    private readonly stateMachine: TripStateMachine,
    private readonly eventBus: EventBusService,
    private readonly db: DatabaseService,
  ) {}

  async getProfile(userId: string) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');
    return {
      id: driver.id,
      status: driver.status,
      isOnline: driver.is_online,
      rating: Number(driver.rating),
    };
  }

  async setOnlineStatus(userId: string, isOnline: boolean) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');
    if (driver.status !== 'approved') {
      throw new ForbiddenException('Driver not approved yet');
    }
    const updated = await this.driverRepo.setOnlineStatus(driver.id, isOnline);
    return { isOnline: updated.is_online };
  }

  async getPendingOffers(userId: string) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');
    const trips = await this.driverRepo.findPendingOffers(driver.id);
    return trips.map((t) => this.formatOffer(t));
  }

  async respondToOffer(userId: string, tripId: string, accept: boolean) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');
    if (!driver.is_online) throw new BadRequestException('Go online to accept rides');

    if (!accept) {
      await this.eventBus.publish(EventType.TRIP_OFFER_DECLINED, {
        tripId,
        driverId: driver.id,
      });
      return { accepted: false };
    }

    const trip = await this.driverRepo.acceptTrip(tripId, driver.id);
    if (!trip) {
      throw new ConflictException({
        message: 'Trip already taken or no longer available',
        error: 'RIDE_ALREADY_TAKEN',
      });
    }

    await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
      tripId,
      fromStatus: TripStatus.SEARCHING,
      toStatus: TripStatus.DRIVER_ASSIGNED,
      passengerId: trip.passenger_id,
      driverId: driver.id,
    });

    return { accepted: true, trip: this.formatTrip(trip) };
  }

  async advanceTripStatus(userId: string, tripId: string) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');

    const active = await this.driverRepo.getActiveTrip(driver.id);
    if (!active || active.id !== tripId) {
      throw new NotFoundException('Active trip not found');
    }

    const nextStatus = DRIVER_TRANSITIONS[active.status];
    if (!nextStatus) {
      throw new BadRequestException(`Cannot advance from status: ${active.status}`);
    }

    this.stateMachine.transition(active.status, nextStatus);
    const updated = await this.driverRepo.updateTripStatus(tripId, driver.id, active.status, nextStatus);
    if (!updated) throw new BadRequestException('Status update failed');

    if (nextStatus === TripStatus.COMPLETED) {
      const price = Number(updated.final_price_uzs ?? updated.fixed_price_uzs ?? updated.offered_price_uzs ?? 0);
      await this.db.query(
        `UPDATE trips SET final_price_uzs = $1, status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [price, tripId],
      );
      updated.final_price_uzs = price;
      updated.status = TripStatus.COMPLETED;

      await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
        tripId,
        fromStatus: active.status,
        toStatus: TripStatus.COMPLETED,
        passengerId: updated.passenger_id,
        driverId: driver.id,
      });

      return this.formatTrip(updated);
    }

    await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
      tripId,
      fromStatus: active.status,
      toStatus: nextStatus,
      passengerId: updated.passenger_id,
      driverId: driver.id,
    });

    return this.formatTrip(updated);
  }

  async updateTripStatus(userId: string, tripId: string, targetStatus: TripStatus) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');

    const active = await this.driverRepo.getActiveTrip(driver.id);
    if (!active || active.id !== tripId) throw new NotFoundException('Active trip not found');

    this.stateMachine.transition(active.status, targetStatus);
    const updated = await this.driverRepo.updateTripStatus(tripId, driver.id, active.status, targetStatus);
    if (!updated) throw new BadRequestException('Status update failed');

    await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
      tripId,
      fromStatus: active.status,
      toStatus: targetStatus,
      passengerId: updated.passenger_id,
      driverId: driver.id,
    });

    return this.formatTrip(updated);
  }

  async getActiveTrip(userId: string) {
    const driver = await this.driverRepo.getByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');
    const trip = await this.driverRepo.getActiveTrip(driver.id);
    return trip ? this.formatTripWithCoords(trip) : null;
  }

  private formatOffer(t: import('../infrastructure/driver.repository').TripWithCoords) {
    return {
      tripId: t.id,
      pickupAddress: t.pickup_address,
      destinationAddress: t.destination_address,
      pickup: { lat: t.pickup_lat, lng: t.pickup_lng },
      destination: t.dest_lat ? { lat: t.dest_lat, lng: t.dest_lng } : null,
      priceUzs: Number(t.fixed_price_uzs ?? t.offered_price_uzs ?? 0),
      category: t.booking_category,
      rideType: t.ride_type,
      distanceM: t.estimated_distance_m,
    };
  }

  private formatTrip(t: import('../infrastructure/driver.repository').TripRow) {
    return {
      id: t.id,
      status: t.status,
      pickupAddress: t.pickup_address,
      destinationAddress: t.destination_address,
      priceUzs: Number(t.fixed_price_uzs ?? t.offered_price_uzs ?? t.final_price_uzs ?? 0),
      category: t.booking_category,
      rideType: t.ride_type,
    };
  }

  private formatTripWithCoords(t: import('../infrastructure/driver.repository').TripWithCoords) {
    return {
      ...this.formatTrip(t),
      pickup: { lat: t.pickup_lat, lng: t.pickup_lng },
      destination: t.dest_lat ? { lat: t.dest_lat, lng: t.dest_lng } : null,
    };
  }
}
