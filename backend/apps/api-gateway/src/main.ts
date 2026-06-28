import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { GlobalExceptionFilter } from '@taxi/common';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('v1');
  app.enableCors({ origin: true, credentials: true });

  const swagger = new DocumentBuilder()
    .setTitle('Taxi UZ API')
    .setDescription('Nationwide taxi platform for Uzbekistan')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = process.env.PORT || process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway running on :${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
