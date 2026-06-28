import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { DatabaseModule } from '@taxi/database';
import { EventBusModule } from '@taxi/events';
import { RideController } from './presentation/ride.controller';
import { DriverController } from './presentation/driver.controller';
import { RideService } from './application/ride.service';
import { DriverService } from './application/driver.service';
import { FareCalculatorService } from './application/fare-calculator.service';
import { TripStateMachine } from './domain/trip-state-machine';
import { TripRepository } from './infrastructure/trip.repository';
import { DriverRepository } from './infrastructure/driver.repository';
import { DriverMatchingService } from './application/driver-matching.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret',
    }),
    DatabaseModule,
    EventBusModule,
  ],
  controllers: [RideController, DriverController],
  providers: [
    RideService,
    DriverService,
    FareCalculatorService,
    TripStateMachine,
    TripRepository,
    DriverRepository,
    DriverMatchingService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class RideModule {}
