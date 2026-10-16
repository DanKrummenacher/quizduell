import { Controller, Get } from '@nestjs/common';
import type { PublicInfo } from '../contracts/game.contract.js';
import { QuestionsService } from '../questions/questions.service.js';
import { SettingsService } from '../settings/settings.service.js';

@Controller('info')
export class PublicController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get()
  async info(): Promise<PublicInfo> {
    const settings = this.settingsService.get();
    const activeQuestions = await this.questionsService.countActive();
    return {
      questionsPerGame: settings.questionsPerGame,
      questionDurationSec: settings.questionDurationSec,
      idleResetSec: settings.idleResetSec,
      playable: activeQuestions >= settings.questionsPerGame,
    };
  }
}
