import { Injectable, Logger } from '@nestjs/common';
import { haversineDistanceM } from '@taxi/common';

export interface LocationUpdate {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

export interface FakeGpsAlert {
  detected: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

@Injectable()
export class FakeGpsDetector {
  private readonly logger = new Logger(FakeGpsDetector.name);
  private readonly history = new Map<string, LocationUpdate[]>();
  private readonly MAX_SPEED_KMH = 200;
  private readonly MAX_JUMP_M = 5000;
  private readonly MIN_TIME_MS = 1000;

  analyze(driverId: string, update: LocationUpdate): FakeGpsAlert {
    const prev = this.history.get(driverId) ?? [];
    prev.push(update);
    if (prev.length > 10) prev.shift();
    this.history.set(driverId, prev);

    if (prev.length < 2) return { detected: false };

    const last = prev[prev.length - 2];
    const timeDeltaMs = update.timestamp - last.timestamp;
    if (timeDeltaMs < this.MIN_TIME_MS) return { detected: false };

    const distanceM = haversineDistanceM(last.lat, last.lng, update.lat, update.lng);
    const speedKmh = (distanceM / timeDeltaMs) * 3600;

    if (speedKmh > this.MAX_SPEED_KMH) {
      this.logger.warn(`Fake GPS: driver ${driverId} impossible speed ${speedKmh.toFixed(0)} km/h`);
      return { detected: true, reason: `Impossible speed: ${speedKmh.toFixed(0)} km/h`, severity: 'high' };
    }

    if (distanceM > this.MAX_JUMP_M && timeDeltaMs < 5000) {
      this.logger.warn(`Fake GPS: driver ${driverId} location jump ${distanceM.toFixed(0)}m`);
      return { detected: true, reason: `Location jump: ${distanceM.toFixed(0)}m in ${timeDeltaMs}ms`, severity: 'high' };
    }

    if (update.accuracy && update.accuracy > 100) {
      return { detected: true, reason: 'Poor GPS accuracy with suspicious movement', severity: 'medium' };
    }

    if (update.speed !== undefined && Math.abs(update.speed - speedKmh) > 50) {
      return { detected: true, reason: 'Reported speed mismatch with calculated speed', severity: 'medium' };
    }

    return { detected: false };
  }

  clearHistory(driverId: string) {
    this.history.delete(driverId);
  }
}
