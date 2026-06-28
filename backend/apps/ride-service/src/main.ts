import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { RideModule } from './ride.module';

async function bootstrap() {
  const app = await NestFactory.create(RideModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('v1');
  const port = process.env.RIDE_SERVICE_PORT || 3003;
  await app.listen(port);
  console.log(`Ride Service running on :${port}`);
}
bootstrap();
