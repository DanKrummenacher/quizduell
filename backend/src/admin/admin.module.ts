import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GameModule } from '../game/game.module.js';
import { QuestionsModule } from '../questions/questions.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StatsModule } from '../stats/stats.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminQuestionsController } from './admin-questions.controller.js';
import { AdminSettingsController } from './admin-settings.controller.js';

@Module({
  imports: [AuthModule, GameModule, QuestionsModule, SettingsModule, StatsModule],
  controllers: [
    AdminAuthController,
    AdminQuestionsController,
    AdminSettingsController,
    AdminDashboardController,
  ],
})
export class AdminModule {}
