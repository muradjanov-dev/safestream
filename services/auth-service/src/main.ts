import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@safestream/exceptions';
import { AppLogger } from '@safestream/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.use(helmet());
  app.enableCors({
    origin: config.get('APP_URL', 'http://localhost:3000'),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = config.get<number>('APP_PORT', 3001);
  await app.listen(port);
  logger.log(`Auth service running on port ${port}`, 'Bootstrap');
}

bootstrap();
