import { Injectable } from '@nestjs/common';
import {
  COMMISSION_PERCENT,
  PLATFORM_MIN_OFFER_PERCENT,
  PLATFORM_MAX_OFFER_PERCENT,
} from '@taxi/common';
import {
  BookingCategory,
  FareBreakdown,
  FareEstimate,
  GeoPoint,
  RideType,
} from '@taxi/database';
import { haversineDistanceM } from '@taxi/common';
import { DatabaseService } from '@taxi/database';

interface PricingRow {
  base_fare_uzs: number;
  per_km_uzs: number;
  per_minute_uzs: number;
  min_fare_uzs: number;
  night_multiplier: number;
  peak_multiplier: number;
  commission_percent: number;
}

@Injectable()
export class FareCalculatorService {
  constructor(private readonly db: DatabaseService) {}

  async estimate(
    pickup: GeoPoint,
    destination: GeoPoint | null,
    category: BookingCategory,
    rideType: RideType,
    city = 'Tashkent',
    offeredPriceUzs?: number,
  ): Promise<FareEstimate> {
    const pricing = await this.getPricing(city, category);

    const distanceM = destination
      ? haversineDistanceM(pickup.lat, pickup.lng, destination.lat, destination.lng)
      : 0;
    const durationS = Math.round((distanceM / 1000) * 120); // ~30 km/h avg in city

    const isNight = this.isNightTime();
    const isPeak = this.isPeakHour();

    const breakdown = this.calculateBreakdown(
      pricing,
      distanceM,
      durationS,
      isNight,
      isPeak,
    );

    if (rideType === RideType.OFFER && offeredPriceUzs) {
      const minOffer = Math.round(breakdown.totalUzs * PLATFORM_MIN_OFFER_PERCENT);
      const maxOffer = Math.round(breakdown.totalUzs * PLATFORM_MAX_OFFER_PERCENT);
      if (offeredPriceUzs < minOffer || offeredPriceUzs > maxOffer) {
        throw new Error(`Offer must be between ${minOffer} and ${maxOffer} UZS`);
      }
      breakdown.totalUzs = offeredPriceUzs;
    }

    return { totalUzs: breakdown.totalUzs, breakdown, currency: 'UZS' };
  }

  calculateMeterFare(
    pricing: PricingRow,
    distanceM: number,
    durationS: number,
  ): FareBreakdown {
    return this.calculateBreakdown(pricing, distanceM, durationS, this.isNightTime(), this.isPeakHour());
  }

  private calculateBreakdown(
    pricing: PricingRow,
    distanceM: number,
    durationS: number,
    isNight: boolean,
    isPeak: boolean,
  ): FareBreakdown {
    const distanceKm = distanceM / 1000;
    const durationMin = durationS / 60;

    const baseFareUzs = Number(pricing.base_fare_uzs);
    const distanceUzs = Math.round(distanceKm * Number(pricing.per_km_uzs));
    const timeUzs = Math.round(durationMin * Number(pricing.per_minute_uzs));
    const nightMultiplier = isNight ? Number(pricing.night_multiplier) : 1;
    const peakMultiplier = isPeak ? Number(pricing.peak_multiplier) : 1;

    const subtotal = baseFareUzs + distanceUzs + timeUzs;
    const withMultipliers = Math.round(subtotal * nightMultiplier * peakMultiplier);
    const totalUzs = Math.max(withMultipliers, Number(pricing.min_fare_uzs));
    const commissionUzs = Math.round(totalUzs * (Number(pricing.commission_percent) / 100));

    return {
      baseFareUzs,
      distanceUzs,
      timeUzs,
      trafficMultiplier: 1,
      peakMultiplier,
      nightMultiplier,
      waitingUzs: 0,
      airportFeeUzs: 0,
      tollUzs: 0,
      promoDiscountUzs: 0,
      commissionUzs,
      totalUzs,
    };
  }

  private async getPricing(city: string, category: BookingCategory): Promise<PricingRow> {
    const result = await this.db.query<PricingRow>(
      `SELECT * FROM pricing_config WHERE city = $1 AND category = $2 AND is_active = TRUE`,
      [city, category],
    );
    if (!result.rows[0]) {
      throw new Error(`No pricing config for ${city}/${category}`);
    }
    return result.rows[0];
  }

  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 6;
  }

  private isPeakHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }
}
