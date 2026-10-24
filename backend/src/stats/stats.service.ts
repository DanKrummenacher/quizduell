import { Injectable, Logger } from '@nestjs/common';
import type { EndReason, GameMode } from '../contracts/game.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { playedGames } from '../database/schema.js';

/** One duel as it is kept for the statistics. */
export interface GameRecord {
  mode: GameMode;
  status: 'finished' | 'aborted';
  endReason: EndReason | null;
  questionCount: number;
  /** Questions revealed before the duel ended. */
  questionsPlayed: number;
  rematch: boolean;
  durationMs: number;
  /** Final scores, highest first. */
  scores: number[];
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly database: DatabaseService) {}

  async recordGame(record: GameRecord): Promise<void> {
    try {
      await this.database.db.insert(playedGames).values({
        ...record,
        scores: [...record.scores].sort((a, b) => b - a),
      });
    } catch (error) {
      this.logger.error(`Could not record played game: ${String(error)}`);
    }
  }
}
