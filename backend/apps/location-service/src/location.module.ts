import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { DatabaseModule } from '@taxi/database';
import { EventBusModule } from '@taxi/events';
import { LocationController } from './presentation/location.controller';
import { DriverLocationController } from './presentation/driver-location.controller';
import { LocationService, RouteService } from './application/location.service';
import { DriverLocationService } from './application/driver-location.service';
import { FakeGpsDetector } from './domain/fake-gps.detector';
import { LocationRepository } from './infrastructure/location.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret' }),
    DatabaseModule,
    EventBusModule,
  ],
  controllers: [LocationController, DriverLocationController],
  providers: [
    LocationService,
    DriverLocationService,
    FakeGpsDetector,
    RouteService,
    LocationRepository,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class LocationModule {}
