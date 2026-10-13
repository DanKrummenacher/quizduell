import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createApp } from './app.factory.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';

const app = await createApp();
const config = app.get<AppConfig>(APP_CONFIG);
await app.listen(config.port, '0.0.0.0');
Logger.log(`playduelio backend listening on port ${config.port}`, 'Bootstrap');
