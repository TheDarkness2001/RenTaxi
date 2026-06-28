import { Injectable } from '@nestjs/common';
import {
  TripStatus,
  RideType,
  BookingCategory,
  PaymentMethod,
  FareBreakdown,
} from '@taxi/database';
import { DatabaseService } from '@taxi/database';

interface TripRow {
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
  created_at: Date;
}

@Injectable()
export class TripRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    passengerId: string;
    rideType: RideType;
    category: BookingCategory;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    destinationLat?: number;
    destinationLng?: number;
    destinationAddress?: string;
    fixedPriceUzs?: number;
    offeredPriceUzs?: number;
    fareBreakdown?: FareBreakdown;
    paymentMethod: PaymentMethod;
  }): Promise<TripRow> {
    const result = await this.db.query<TripRow>(
      `INSERT INTO trips (
        passenger_id, ride_type, booking_category,
        pickup, pickup_address,
        destination, destination_address,
        fixed_price_uzs, offered_price_uzs, fare_breakdown,
        payment_method, status
      ) VALUES (
        $1, $2, $3,
        ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6,
        CASE WHEN $7 IS NOT NULL THEN ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography ELSE NULL END,
        $9,
        $10, $11, $12,
        $13, 'requested'
      ) RETURNING *`,
      [
        data.passengerId,
        data.rideType,
        data.category,
        data.pickupLat,
        data.pickupLng,
        data.pickupAddress,
        data.destinationLat ?? null,
        data.destinationLng ?? null,
        data.destinationAddress ?? null,
        data.fixedPriceUzs ?? null,
        data.offeredPriceUzs ?? null,
        data.fareBreakdown ? JSON.stringify(data.fareBreakdown) : null,
        data.paymentMethod,
      ],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<TripRow | null> {
    const result = await this.db.query<TripRow>('SELECT * FROM trips WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async updateStatus(
    tripId: string,
    fromStatus: TripStatus,
    toStatus: TripStatus,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<TripRow> {
    return this.db.transaction(async (client) => {
      const result = await client.query<TripRow>(
        `UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING *`,
        [toStatus, tripId, fromStatus],
      );
      if (!result.rows[0]) throw new Error('Trip not found or invalid status');

      await client.query(
        `INSERT INTO trip_events (trip_id, from_status, to_status, actor_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [tripId, fromStatus, toStatus, actorId ?? null, metadata ? JSON.stringify(metadata) : null],
      );

      return result.rows[0];
    });
  }

  async assignDriver(tripId: string, driverId: string): Promise<TripRow> {
    const result = await this.db.query<TripRow>(
      `UPDATE trips SET driver_id = $1, status = 'driver_assigned', updated_at = NOW()
       WHERE id = $2 AND status = 'searching' RETURNING *`,
      [driverId, tripId],
    );
    return result.rows[0];
  }

  async getPassengerHistory(passengerId: string, limit = 20): Promise<TripRow[]> {
    const result = await this.db.query<TripRow>(
      `SELECT * FROM trips WHERE passenger_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [passengerId, limit],
    );
    return result.rows;
  }

  async completeTrip(tripId: string, finalPriceUzs: number, breakdown: FareBreakdown): Promise<TripRow> {
    const result = await this.db.query<TripRow>(
      `UPDATE trips SET
        status = 'completed',
        final_price_uzs = $1,
        fare_breakdown = $2,
        completed_at = NOW(),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [finalPriceUzs, JSON.stringify(breakdown), tripId],
    );
    return result.rows[0];
  }
}
