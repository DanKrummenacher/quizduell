import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import type { DashboardStats } from '../contracts/admin.contract.js';
import { GameGateway } from '../game/game.gateway.js';
import { GameService } from '../game/game.service.js';
import { QuestionsService } from '../questions/questions.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StatsService } from '../stats/stats.service.js';

@UseGuards(AdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
    private readonly statsService: StatsService,
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Get()
  async get(): Promise<DashboardStats> {
    const [activeQuestions, totalQuestions, games] = await Promise.all([
      this.questionsService.countActive(),
      this.questionsService.countAll(),
      this.statsService.countGames(),
    ]);
    const live = this.gameService.getLiveStats();
    return {
      activeQuestions,
      totalQuestions,
      requiredQuestions: this.settingsService.get().questionsPerGame,
      playersOnline: this.gameGateway.onlineCount,
      activeGames: live.activeGames,
      playersSearching: live.playersSearching,
      gamesToday: games.today,
      gamesTotal: games.total,
    };
  }
}
