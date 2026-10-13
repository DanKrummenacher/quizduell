import { type INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';
import { SocketIoAdapter } from './game/socket-io.adapter.js';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  configureApp(app);
  return app;
}

export function configureApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app as NestExpressApplication;

  // Render terminates TLS in front of the app; needed for correct client IPs.
  express.set('trust proxy', 1);
  express.disable('x-powered-by');
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useWebSocketAdapter(new SocketIoAdapter(app, config.corsOrigins));
  app.enableShutdownHooks();

  Logger.log(`CORS origins: ${config.corsOrigins.join(', ')}`, 'Bootstrap');
}
