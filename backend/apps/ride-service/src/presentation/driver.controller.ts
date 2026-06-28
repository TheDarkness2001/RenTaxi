import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { IsBoolean, IsEnum } from 'class-validator';
import { RequireKyc, Roles } from '@taxi/common';
import { TripStatus } from '@taxi/database';
import { DriverService } from '../application/driver.service';

class OnlineStatusDto {
  @IsBoolean()
  isOnline!: boolean;
}

class RespondOfferDto {
  @IsBoolean()
  accept!: boolean;
}

class UpdateStatusDto {
  @IsEnum(TripStatus)
  status!: TripStatus;
}

@Controller('drivers')
@RequireKyc()
@Roles('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('profile')
  getProfile(@Req() req: { user: { sub: string } }) {
    return this.driverService.getProfile(req.user.sub);
  }

  @Patch('status')
  setOnline(@Req() req: { user: { sub: string } }, @Body() dto: OnlineStatusDto) {
    return this.driverService.setOnlineStatus(req.user.sub, dto.isOnline);
  }

  @Get('offers')
  getOffers(@Req() req: { user: { sub: string } }) {
    return this.driverService.getPendingOffers(req.user.sub);
  }

  @Post('trips/:id/respond')
  respondToOffer(
    @Req() req: { user: { sub: string } },
    @Param('id') tripId: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.driverService.respondToOffer(req.user.sub, tripId, dto.accept);
  }

  @Get('trips/active')
  getActiveTrip(@Req() req: { user: { sub: string } }) {
    return this.driverService.getActiveTrip(req.user.sub);
  }

  @Patch('trips/:id/advance')
  advanceTrip(@Req() req: { user: { sub: string } }, @Param('id') tripId: string) {
    return this.driverService.advanceTripStatus(req.user.sub, tripId);
  }

  @Patch('trips/:id/status')
  updateStatus(
    @Req() req: { user: { sub: string } },
    @Param('id') tripId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.driverService.updateTripStatus(req.user.sub, tripId, dto.status);
  }
}
