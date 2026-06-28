import { Injectable } from '@nestjs/common';
import { haversineDistanceM } from '@taxi/common';
import { BookingCategory, GeoPoint } from '@taxi/database';
import { LocationRepository } from '../infrastructure/location.repository';

@Injectable()
export class RouteService {
  async getRoute(origin: GeoPoint, destination: GeoPoint) {
    const distanceM = haversineDistanceM(origin.lat, origin.lng, destination.lat, destination.lng);
    const durationS = Math.round((distanceM / 1000) * 120);
    const trafficMultiplier = this.estimateTrafficMultiplier();

    return {
      distanceM: Math.round(distanceM),
      durationS: Math.round(durationS * trafficMultiplier),
      baseDurationS: durationS,
      trafficMultiplier,
      polyline: this.encodeSimplePolyline(origin, destination),
      eta: new Date(Date.now() + durationS * trafficMultiplier * 1000).toISOString(),
    };
  }

  private estimateTrafficMultiplier(): number {
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.4;
    if (hour >= 22 || hour < 6) return 0.9;
    return 1.0;
  }

  private encodeSimplePolyline(from: GeoPoint, to: GeoPoint): string {
    return `${from.lat.toFixed(5)},${from.lng.toFixed(5)}|${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  }
}

@Injectable()
export class LocationService {
  constructor(
    private readonly repo: LocationRepository,
    private readonly routeService: RouteService,
  ) {}

  async getNearbyDrivers(lat: number, lng: number, category?: BookingCategory) {
    const drivers = await this.repo.findNearbyDrivers(lat, lng, category);
    return {
      count: drivers.length,
      drivers: drivers.map((d) => ({
        driverId: d.id,
        lat: d.lat,
        lng: d.lng,
        heading: d.heading,
        rating: Number(d.rating),
        distanceM: Math.round(Number(d.distance_m)),
        category: d.category,
      })),
    };
  }

  async getRoute(origin: GeoPoint, destination: GeoPoint) {
    return this.routeService.getRoute(origin, destination);
  }
}
