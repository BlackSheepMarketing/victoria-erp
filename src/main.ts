import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // Prefijo global de la API. El front consume VITE_API_URL = http://host/api
  app.setGlobalPrefix('api');

  // CORS: origenes del front separados por coma en CORS_ORIGINS.
  const origins = (config.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });

  // Validacion automatica de DTOs con class-validator.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta props no declaradas en el DTO
      transform: true, // convierte tipos (query strings -> number, etc.)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = parseInt(config.get<string>('PORT', '3000'), 10);
  await app.listen(port);
  new Logger('Bootstrap').log(`Victoria ERP API escuchando en :${port}/api`);
}
bootstrap();
