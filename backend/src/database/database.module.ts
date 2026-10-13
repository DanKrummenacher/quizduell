import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: async (config: AppConfig) => {
        const service = new DatabaseService(config);
        await service.connect();
        return service;
      },
      inject: [APP_CONFIG],
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
