import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@taxi/common';
import { DatabaseModule } from '@taxi/database';
import { EventBusModule } from '@taxi/events';
import { IdentityController } from './presentation/identity.controller';
import { IdentityService } from './application/identity.service';
import { KycVerificationService } from './application/kyc-verification.service';
import { OcrService } from './infrastructure/ocr.service';
import { FaceMatchService } from './infrastructure/face-match.service';
import { IdentityRepository } from './infrastructure/identity.repository';

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
  controllers: [IdentityController],
  providers: [
    IdentityService,
    KycVerificationService,
    OcrService,
    FaceMatchService,
    IdentityRepository,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class IdentityModule {}
