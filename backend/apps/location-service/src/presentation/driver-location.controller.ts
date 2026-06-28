import { Body, Controller, Patch, Req } from '@nestjs/common';
import { IsNumber, IsOptional } from 'class-validator';
import { Roles, RequireKyc } from '@taxi/common';
import { DriverLocationService } from '../application/driver-location.service';

class UpdateLocationDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

@Controller('drivers/location')
@RequireKyc()
@Roles('driver')
export class DriverLocationController {
  constructor(private readonly driverLocationService: DriverLocationService) {}

  @Patch()
  updateLocation(@Req() req: { user: { sub: string } }, @Body() dto: UpdateLocationDto) {
    return this.driverLocationService.updateLocation(
      req.user.sub,
      dto.lat,
      dto.lng,
      dto.heading,
      dto.speed,
      dto.accuracy,
    );
  }
}
