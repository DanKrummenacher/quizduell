export interface GameSettings {
  questionsPerGame: number;
  questionDurationSec: number;
  /** How long the correct answer is shown after each question. */
  revealDurationSec: number;
  /** Faster correct answers earn up to 100 extra points. */
  speedBonusEnabled: boolean;
  /** Time both players have to agree on a rematch. */
  rematchTimeoutSec: number;
  /** Seconds of inactivity before stand devices return to the start screen. 0 = off. */
  idleResetSec: number;
}

type NumericSetting = Exclude<keyof GameSettings, 'speedBonusEnabled'>;

export const DEFAULT_SETTINGS: GameSettings = {
  questionsPerGame: 7,
  questionDurationSec: 20,
  revealDurationSec: 4,
  speedBonusEnabled: true,
  rematchTimeoutSec: 45,
  idleResetSec: 120,
};

export const SETTINGS_LIMITS: Record<NumericSetting, { min: number; max: number }> =
  {
    questionsPerGame: { min: 3, max: 20 },
    questionDurationSec: { min: 5, max: 60 },
    revealDurationSec: { min: 2, max: 15 },
    rematchTimeoutSec: { min: 15, max: 120 },
    idleResetSec: { min: 0, max: 600 },
  };
