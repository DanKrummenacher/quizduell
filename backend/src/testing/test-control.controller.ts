import {
  Body,
  type CanActivate,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Injectable,
  NotFoundException,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DatabaseService } from '../database/database.service.js';
import { QuestionsService } from '../questions/questions.service.js';
import type { GameSettings } from '../settings/game-settings.js';
import { UpdateSettingsDto } from '../settings/settings.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import { generateDemoData } from './demo-data.js';

/** Hides the test endpoints unless `TEST_CONTROL=true` (never in production). */
@Injectable()
class TestControlGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(): boolean {
    if (!this.config.testControl) {
      throw new NotFoundException();
    }
    return true;
  }
}

/** Lets end-to-end tests reset questions and settings between runs. */
@UseGuards(TestControlGuard)
@Controller('test')
export class TestControlController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
    private readonly database: DatabaseService,
  ) {}

  @Delete('questions')
  @HttpCode(204)
  async removeQuestions(): Promise<void> {
    await this.questionsService.removeAll();
  }

  @Post('questions/samples')
  async importSamples(): Promise<{ imported: number }> {
    return { imported: await this.questionsService.importSamples() };
  }

  /** 60 days of plausible duels and answers for the existing questions. */
  @Post('demo-data')
  async demoData(): Promise<{ games: number }> {
    return { games: await generateDemoData(this.database) };
  }

  @Put('settings')
  updateSettings(@Body() body: UpdateSettingsDto): Promise<GameSettings> {
    return this.settingsService.update(body);
  }
}
