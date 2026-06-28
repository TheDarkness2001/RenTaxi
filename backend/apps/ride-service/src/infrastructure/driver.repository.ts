import { Injectable } from '@nestjs/common';
import { DatabaseService, TripStatus, RideType, BookingCategory, PaymentMethod, FareBreakdown } from '@taxi/database';

export interface TripRow {
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
  fare_breakdown: FareBreakdown | null;
  payment_method: PaymentMethod;
  estimated_distance_m: number | null;
  created_at: Date;
}

export interface DriverRow {
  id: string;
  user_id: string;
  status: string;
  is_online: boolean;
  rating: number;
}

export interface TripWithCoords extends TripRow {
  pickup_lat: number;
  pickup_lng: number;
  dest_lat: number | null;
  dest_lng: number | null;
}

@Injectable()
export class DriverRepository {
  constructor(private readonly db: DatabaseService) {}

  async getByUserId(userId: string): Promise<DriverRow | null> {
    const result = await this.db.query<DriverRow>(
      'SELECT id, user_id, status, is_online, rating FROM drivers WHERE user_id = $1',
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async setOnlineStatus(driverId: string, isOnline: boolean): Promise<DriverRow> {
    const result = await this.db.query<DriverRow>(
      `UPDATE drivers SET is_online = $1, updated_at = NOW() WHERE id = $2 RETURNING id, user_id, status, is_online, rating`,
      [isOnline, driverId],
    );
    return result.rows[0];
  }

  async findPendingOffers(driverId: string, radiusM = 5000): Promise<TripWithCoords[]> {
    const result = await this.db.query<TripWithCoords>(
      `SELECT t.*,
              ST_Y(t.pickup::geometry) AS pickup_lat,
              ST_X(t.pickup::geometry) AS pickup_lng,
              ST_Y(t.destination::geometry) AS dest_lat,
              ST_X(t.destination::geometry) AS dest_lng
       FROM trips t
       JOIN drivers d ON d.id = $1
       WHERE t.status = 'searching'
         AND d.is_online = TRUE
         AND d.status = 'approved'
         AND d.current_location IS NOT NULL
         AND ST_DWithin(t.pickup, d.current_location, $2)
       ORDER BY t.created_at ASC
       LIMIT 10`,
      [driverId, radiusM],
    );
    return result.rows;
  }

  async acceptTrip(tripId: string, driverId: string): Promise<TripRow | null> {
    return this.db.transaction(async (client) => {
      const result = await client.query<TripRow>(
        `UPDATE trips SET driver_id = $1, status = 'driver_assigned', updated_at = NOW()
         WHERE id = $2 AND status = 'searching' AND driver_id IS NULL
         RETURNING *`,
        [driverId, tripId],
      );
      if (!result.rows[0]) return null;

      await client.query(
        `INSERT INTO trip_events (trip_id, from_status, to_status, actor_id)
         VALUES ($1, 'searching', 'driver_assigned', $2)`,
        [tripId, driverId],
      );

      return result.rows[0];
    });
  }

  async getActiveTrip(driverId: string): Promise<TripWithCoords | null> {
    const result = await this.db.query<TripWithCoords>(
      `SELECT t.*,
              ST_Y(t.pickup::geometry) AS pickup_lat,
              ST_X(t.pickup::geometry) AS pickup_lng,
              ST_Y(t.destination::geometry) AS dest_lat,
              ST_X(t.destination::geometry) AS dest_lng
       FROM trips t
       WHERE t.driver_id = $1
         AND t.status NOT IN ('completed', 'paid', 'rated', 'cancelled')
       ORDER BY t.created_at DESC LIMIT 1`,
      [driverId],
    );
    return result.rows[0] ?? null;
  }

  async updateTripStatus(
    tripId: string,
    driverId: string,
    fromStatus: TripStatus,
    toStatus: TripStatus,
  ): Promise<TripRow | null> {
    const result = await this.db.query<TripRow>(
      `UPDATE trips SET status = $1, updated_at = NOW(),
        started_at = CASE WHEN $1 = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $2 AND driver_id = $3 AND status = $4
       RETURNING *`,
      [toStatus, tripId, driverId, fromStatus],
    );
    if (result.rows[0]) {
      await this.db.query(
        `INSERT INTO trip_events (trip_id, from_status, to_status, actor_id) VALUES ($1, $2, $3, $4)`,
        [tripId, fromStatus, toStatus, driverId],
      );
    }
    return result.rows[0] ?? null;
  }
}
