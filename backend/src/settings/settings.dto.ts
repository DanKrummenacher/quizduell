import { IsBoolean, IsInt, Max, Min } from 'class-validator';
import { SETTINGS_LIMITS as L, type GameSettings } from './game-settings.js';

export class UpdateSettingsDto implements GameSettings {
  @IsInt()
  @Min(L.questionsPerGame.min)
  @Max(L.questionsPerGame.max)
  questionsPerGame: number;

  @IsInt()
  @Min(L.questionDurationSec.min)
  @Max(L.questionDurationSec.max)
  questionDurationSec: number;

  @IsInt()
  @Min(L.revealDurationSec.min)
  @Max(L.revealDurationSec.max)
  revealDurationSec: number;

  @IsBoolean()
  speedBonusEnabled: boolean;

  @IsInt()
  @Min(L.rematchTimeoutSec.min)
  @Max(L.rematchTimeoutSec.max)
  rematchTimeoutSec: number;

  @IsInt()
  @Min(L.idleResetSec.min)
  @Max(L.idleResetSec.max)
  idleResetSec: number;
}
