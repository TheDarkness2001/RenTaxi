import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { ProxyController, HealthController } from './presentation/proxy.controller';
import { ProxyService } from './application/proxy.service';
import { TripsGateway } from './presentation/trips.gateway';
import { RealtimeEventBridge } from './application/realtime-event-bridge';
import { EventBusModule } from '@taxi/events';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret',
    }),
    EventBusModule,
  ],
  controllers: [ProxyController, HealthController],
  providers: [
    ProxyService,
    TripsGateway,
    RealtimeEventBridge,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class GatewayModule {}
