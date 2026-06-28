import { Injectable } from '@nestjs/common';
import { DatabaseService, BookingCategory } from '@taxi/database';
import { REALTIME } from '@taxi/common';

interface DriverLocationRow {
  id: string;
  user_id: string;
  rating: number;
  distance_m: number;
  lat: number;
  lng: number;
  heading: number | null;
  category: BookingCategory;
}

interface DriverRow {
  id: string;
  user_id: string;
}

@Injectable()
export class LocationRepository {
  constructor(private readonly db: DatabaseService) {}

  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
    heading?: number,
  ): Promise<void> {
    await this.db.query(
      `UPDATE drivers SET
        current_location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        current_heading = $3,
        last_location_at = NOW(),
        updated_at = NOW()
       WHERE id = $4`,
      [lat, lng, heading ?? null, driverId],
    );
  }

  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const result = await this.db.query<DriverRow>(
      'SELECT id, user_id FROM drivers WHERE user_id = $1',
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findNearbyDrivers(
    lat: number,
    lng: number,
    category?: BookingCategory,
    radiusM = REALTIME.DRIVER_SEARCH_RADIUS_M,
  ): Promise<DriverLocationRow[]> {
    const result = await this.db.query<DriverLocationRow>(
      `SELECT d.id, d.user_id, d.rating, d.current_heading AS heading,
              v.category,
              ST_Distance(d.current_location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_m,
              ST_Y(d.current_location::geometry) AS lat,
              ST_X(d.current_location::geometry) AS lng
       FROM drivers d
       JOIN vehicles v ON v.id = d.vehicle_id
       WHERE d.is_online = TRUE
         AND d.status = 'approved'
         AND d.current_location IS NOT NULL
         AND ($3::text IS NULL OR v.category = $3)
         AND ST_DWithin(
           d.current_location,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $4
         )
       ORDER BY distance_m ASC
       LIMIT 50`,
      [lat, lng, category ?? null, radiusM],
    );
    return result.rows;
  }

  async logFraudAlert(driverId: string, reason: string, metadata: Record<string, unknown>): Promise<void> {
    const driver = await this.db.query<{ user_id: string }>(
      'SELECT user_id FROM drivers WHERE id = $1',
      [driverId],
    );
    await this.db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, 'fake_gps_detected', 'driver', $2, $3)`,
      [driver.rows[0]?.user_id ?? null, driverId, JSON.stringify({ reason, ...metadata })],
    );
  }
}
