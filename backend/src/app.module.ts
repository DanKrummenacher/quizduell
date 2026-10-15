import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { HttpThrottlerGuard } from './common/http-throttler.guard.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { GameModule } from './game/game.module.js';
import { HealthController } from './health/health.controller.js';
import { PublicController } from './public/public.controller.js';
import { QuestionsModule } from './questions/questions.module.js';
import { SettingsModule } from './settings/settings.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    // Generous per-IP limit: at the fair many devices share one public IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 2_000 }]),
    QuestionsModule,
    SettingsModule,
    GameModule,
    AdminModule,
  ],
  controllers: [HealthController, PublicController],
  providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}
