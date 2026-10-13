import { Injectable, Logger } from '@nestjs/common';
import { count, sql } from 'drizzle-orm';
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

  async countGames(): Promise<{ today: number; total: number }> {
    const [row] = await this.database.db
      .select({
        total: count(),
        today:
          sql<number>`count(*) filter (where ${playedGames.finishedAt} >= (date_trunc('day', now() at time zone 'Europe/Zurich') at time zone 'Europe/Zurich'))`.mapWith(
            Number,
          ),
      })
      .from(playedGames);
    return { today: row?.today ?? 0, total: row?.total ?? 0 };
  }
}
