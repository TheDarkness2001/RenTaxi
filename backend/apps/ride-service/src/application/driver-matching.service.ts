import { Injectable } from '@nestjs/common';
import { REALTIME } from '@taxi/common';
import { BookingCategory } from '@taxi/database';
import { DatabaseService } from '@taxi/database';

interface NearbyDriver {
  id: string;
  user_id: string;
  rating: number;
  distance_m: number;
  lat: number;
  lng: number;
}

@Injectable()
export class DriverMatchingService {
  constructor(private readonly db: DatabaseService) {}

  async findNearbyDrivers(
    lat: number,
    lng: number,
    category: BookingCategory,
    radiusM = REALTIME.DRIVER_SEARCH_RADIUS_M,
  ): Promise<NearbyDriver[]> {
    const result = await this.db.query<NearbyDriver>(
      `SELECT d.id, d.user_id, d.rating,
              ST_Distance(d.current_location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_m,
              ST_Y(d.current_location::geometry) AS lat,
              ST_X(d.current_location::geometry) AS lng
       FROM drivers d
       JOIN vehicles v ON v.id = d.vehicle_id
       WHERE d.is_online = TRUE
         AND d.status = 'approved'
         AND d.current_location IS NOT NULL
         AND v.category = $3
         AND ST_DWithin(
           d.current_location,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $4
         )
       ORDER BY distance_m ASC
       LIMIT 20`,
      [lat, lng, category, radiusM],
    );
    return result.rows;
  }
}
