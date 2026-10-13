import { Injectable, type OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { settings } from '../database/schema.js';
import { DEFAULT_SETTINGS, type GameSettings } from './game-settings.js';

const SETTINGS_ID = 1;

/** Keeps the game settings in memory so games never wait for the database. */
@Injectable()
export class SettingsService implements OnModuleInit {
  private current: GameSettings = { ...DEFAULT_SETTINGS };

  constructor(private readonly database: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    const [row] = await this.database.db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID));

    if (row) {
      this.current = toSettings(row);
    } else {
      await this.database.db
        .insert(settings)
        .values({ id: SETTINGS_ID, ...DEFAULT_SETTINGS })
        .onConflictDoNothing();
    }
  }

  get(): GameSettings {
    return { ...this.current };
  }

  async update(next: GameSettings): Promise<GameSettings> {
    const values = toSettings(next);
    await this.database.db
      .insert(settings)
      .values({ id: SETTINGS_ID, ...values, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.id,
        set: { ...values, updatedAt: new Date() },
      });
    this.current = values;
    return this.get();
  }
}

function toSettings(source: GameSettings): GameSettings {
  return {
    questionsPerGame: source.questionsPerGame,
    questionDurationSec: source.questionDurationSec,
    revealDurationSec: source.revealDurationSec,
    speedBonusEnabled: source.speedBonusEnabled,
    rematchTimeoutSec: source.rematchTimeoutSec,
    idleResetSec: source.idleResetSec,
  };
}
