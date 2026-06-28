import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('v1');
  const port = process.env.PAYMENT_SERVICE_PORT || 3004;
  await app.listen(port);
  console.log(`Payment Service running on :${port}`);
}
bootstrap();
