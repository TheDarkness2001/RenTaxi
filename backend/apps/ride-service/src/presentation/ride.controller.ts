import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RequireKyc } from '@taxi/common';
import { RideType, BookingCategory, PaymentMethod } from '@taxi/database';
import { RideService, CreateRideDto } from '../application/ride.service';

class GeoPointDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  address?: string;
}

class EstimateDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  pickup!: GeoPointDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  destination?: GeoPointDto;

  @IsEnum(BookingCategory)
  category!: BookingCategory;

  @IsEnum(RideType)
  rideType!: RideType;

  @IsOptional()
  @IsNumber()
  offeredPriceUzs?: number;
}

class CreateRideRequestDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  pickup!: GeoPointDto & { address: string };

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  destination?: GeoPointDto & { address: string };

  @IsEnum(BookingCategory)
  category!: BookingCategory;

  @IsEnum(RideType)
  rideType!: RideType;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsNumber()
  offeredPriceUzs?: number;
}

@Controller('rides')
@RequireKyc()
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post('estimate')
  estimate(@Body() dto: EstimateDto) {
    return this.rideService.estimate(
      dto.pickup,
      dto.destination ?? null,
      dto.category,
      dto.rideType,
      dto.offeredPriceUzs,
    );
  }

  @Post()
  createRide(@Req() req: { user: { sub: string } }, @Body() dto: CreateRideRequestDto) {
    return this.rideService.createRide(req.user.sub, dto as CreateRideDto);
  }

  @Get('history/list')
  getHistory(@Req() req: { user: { sub: string } }) {
    return this.rideService.getHistory(req.user.sub);
  }

  @Get(':id')
  getTrip(@Param('id') id: string) {
    return this.rideService.getTrip(id);
  }

  @Patch(':id/cancel')
  cancelTrip(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
    @Body('reason') reason?: string,
  ) {
    return this.rideService.cancelTrip(id, req.user.sub, reason);
  }
}
