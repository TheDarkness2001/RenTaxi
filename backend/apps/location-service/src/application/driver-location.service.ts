import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventBusService, EventType } from '@taxi/events';
import { LocationRepository } from '../infrastructure/location.repository';
import { FakeGpsDetector } from '../domain/fake-gps.detector';

@Injectable()
export class DriverLocationService {
  constructor(
    private readonly repo: LocationRepository,
    private readonly fakeGps: FakeGpsDetector,
    private readonly eventBus: EventBusService,
  ) {}

  async updateLocation(
    userId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
    accuracy?: number,
  ) {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundException('Driver profile not found');

    const alert = this.fakeGps.analyze(driver.id, {
      lat,
      lng,
      heading,
      speed,
      accuracy,
      timestamp: Date.now(),
    });

    if (alert.detected && alert.severity === 'high') {
      await this.repo.logFraudAlert(driver.id, alert.reason!, { lat, lng, speed });
      throw new ForbiddenException({
        message: alert.reason,
        error: 'FAKE_GPS_DETECTED',
      });
    }

    await this.repo.updateDriverLocation(driver.id, lat, lng, heading);

    await this.eventBus.publish(EventType.DRIVER_LOCATION_UPDATED, {
      driverId: driver.id,
      lat,
      lng,
      heading,
    });

    return {
      updated: true,
      driverId: driver.id,
      fakeGpsWarning: alert.detected ? alert.reason : undefined,
    };
  }
}
