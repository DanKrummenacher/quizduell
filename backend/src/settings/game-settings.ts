import type {
  AdminSettings,
  AdminSettingsResponse,
} from '../contracts/admin.contract.js';

/** The game settings are exposed unchanged by the admin API. */
export type GameSettings = AdminSettings;

export const DEFAULT_SETTINGS: GameSettings = {
  questionsPerGame: 7,
  questionDurationSec: 20,
  revealDurationSec: 4,
  speedBonusEnabled: true,
  rematchTimeoutSec: 45,
  idleResetSec: 120,
};

export const SETTINGS_LIMITS: AdminSettingsResponse['limits'] = {
  questionsPerGame: { min: 3, max: 20 },
  questionDurationSec: { min: 5, max: 60 },
  revealDurationSec: { min: 2, max: 15 },
  rematchTimeoutSec: { min: 15, max: 120 },
  idleResetSec: { min: 0, max: 600 },
};
