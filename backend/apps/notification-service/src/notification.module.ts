import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { DatabaseModule } from '@taxi/database';
import { EventBusModule } from '@taxi/events';
import { NotificationController } from './presentation/notification.controller';
import { NotificationService } from './application/notification.service';
import { PushService } from './infrastructure/push.service';
import { NotificationRepository } from './infrastructure/notification.repository';
import { NotificationEventListener } from './application/notification-event.listener';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret' }),
    DatabaseModule,
    EventBusModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PushService,
    NotificationRepository,
    NotificationEventListener,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class NotificationModule {}
