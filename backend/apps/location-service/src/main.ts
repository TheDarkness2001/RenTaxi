import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { LocationModule } from './location.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('v1');
  const port = process.env.LOCATION_SERVICE_PORT || 3005;
  await app.listen(port);
  console.log(`Location Service running on :${port}`);
}
bootstrap();
