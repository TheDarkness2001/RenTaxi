import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { DatabaseModule } from '@taxi/database';
import { EventBusModule } from '@taxi/events';
import { PaymentController } from './presentation/payment.controller';
import { PaymentWebhookController } from './presentation/payment-webhook.controller';
import { PaymentService } from './application/payment.service';
import { WalletService } from './application/wallet.service';
import { RefundService } from './application/refund.service';
import { PaymentRepository } from './infrastructure/payment.repository';
import { ClickProvider } from './infrastructure/providers/click.provider';
import { PaymeProvider } from './infrastructure/providers/payme.provider';
import { UzumProvider } from './infrastructure/providers/uzum.provider';
import { PaymentEventListener } from './application/payment-event.listener';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret' }),
    DatabaseModule,
    EventBusModule,
  ],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentService,
    WalletService,
    RefundService,
    PaymentRepository,
    ClickProvider,
    PaymeProvider,
    UzumProvider,
    PaymentEventListener,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class PaymentModule {}
