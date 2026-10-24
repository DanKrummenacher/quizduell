import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module.js';
import { QuestionsModule } from '../questions/questions.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AnalyticsService } from './analytics.service.js';
import { AuditService } from './audit.service.js';
import { HintsService } from './hints.service.js';

@Module({
  imports: [GameModule, QuestionsModule, SettingsModule],
  controllers: [AdminAuthController, AdminController],
  providers: [
    AdminAuthService,
    AdminGuard,
    AnalyticsService,
    AuditService,
    HintsService,
  ],
})
export class AdminModule {}
