import { Injectable, Logger } from '@nestjs/common';
import type { GameMode } from '../contracts/game.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { playedGames } from '../database/schema.js';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly database: DatabaseService) {}

  async recordGame(mode: GameMode, questionCount: number): Promise<void> {
    try {
      await this.database.db.insert(playedGames).values({ mode, questionCount });
    } catch (error) {
      this.logger.error(`Could not record played game: ${String(error)}`);
    }
  }
}
