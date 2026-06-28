import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { RequireKyc } from '@taxi/common';
import { BookingCategory } from '@taxi/database';
import { LocationService } from '../application/location.service';

class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsEnum(BookingCategory)
  category?: BookingCategory;
}

class RouteQueryDto {
  @Type(() => Number)
  @IsNumber()
  originLat!: number;

  @Type(() => Number)
  @IsNumber()
  originLng!: number;

  @Type(() => Number)
  @IsNumber()
  destLat!: number;

  @Type(() => Number)
  @IsNumber()
  destLng!: number;
}

@Controller('location')
@RequireKyc()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('nearby-drivers')
  nearbyDrivers(@Query() query: NearbyQueryDto) {
    return this.locationService.getNearbyDrivers(query.lat, query.lng, query.category);
  }

  @Get('route')
  route(@Query() query: RouteQueryDto) {
    return this.locationService.getRoute(
      { lat: query.originLat, lng: query.originLng },
      { lat: query.destLat, lng: query.destLng },
    );
  }
}
