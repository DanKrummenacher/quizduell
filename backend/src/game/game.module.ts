import { Module } from '@nestjs/common';
import { QuestionsModule } from '../questions/questions.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StatsModule } from '../stats/stats.module.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';

@Module({
  imports: [QuestionsModule, SettingsModule, StatsModule],
  providers: [GameService, GameGateway],
  exports: [GameService, GameGateway],
})
export class GameModule {}
