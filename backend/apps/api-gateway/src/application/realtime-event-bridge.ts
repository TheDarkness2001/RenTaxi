import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  EventBusService,
  EventType,
  DriverLocationPayload,
  TripRequestedPayload,
} from '@taxi/events';
import { TripsGateway } from '../presentation/trips.gateway';

@Injectable()
export class RealtimeEventBridge implements OnModuleInit {
  private readonly logger = new Logger(RealtimeEventBridge.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly tripsGateway: TripsGateway,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(EventType.DRIVER_LOCATION_UPDATED, async (event) => {
      const payload = event.payload as DriverLocationPayload;
      this.tripsGateway.broadcastDriverLocation(
        payload.driverId,
        payload.lat,
        payload.lng,
        payload.heading,
      );
    });

    this.eventBus.subscribe(EventType.TRIP_STATUS_CHANGED, async (event) => {
      const payload = event.payload as {
        tripId: string;
        toStatus: string;
        passengerId: string;
      };
      this.tripsGateway.emitTripStatus(payload.tripId, payload.toStatus);
    });

    this.eventBus.subscribe(EventType.TRIP_REQUESTED, async (event) => {
      const payload = event.payload as TripRequestedPayload;
      for (const userId of payload.nearbyDriverUserIds ?? []) {
        this.tripsGateway.emitRideOffer(userId, {
          tripId: payload.tripId,
          pickup: payload.pickup,
          destination: payload.destination,
          priceUzs: payload.price,
          category: payload.category,
          rideType: payload.rideType,
        });
      }
    });

    this.logger.log('Realtime event bridge active');
  }
}
