/**
 * Shared contract for the admin REST API (`/api/admin/*`).
 *
 * This file exists twice (backend/src/contracts and
 * frontend/src/app/core/contracts) and must stay identical.
 * CI fails if the two copies drift apart.
 */

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
}

/** Length limits of a question, checked by the admin form and the backend. */
export const QUESTION_LIMITS = {
  text: { min: 5, max: 300 },
  option: { min: 1, max: 100 },
  category: { min: 1, max: 50 },
} as const;

export interface QuestionInput {
  text: string;
  options: string[];
  correctIndex: number;
  category: string | null;
  active: boolean;
}

export interface AdminQuestion extends QuestionInput {
  id: number;
  timesAsked: number;
  timesCorrect: number;
  createdAt: string;
  updatedAt: string;
}

/** Game settings, editable in the admin area. */
export interface AdminSettings {
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

export interface SettingsLimit {
  min: number;
  max: number;
}

export interface AdminSettingsResponse {
  settings: AdminSettings;
  /** Recommended default values, used by "reset to defaults". */
  defaults: AdminSettings;
  limits: Record<
    | 'questionsPerGame'
    | 'questionDurationSec'
    | 'revealDurationSec'
    | 'rematchTimeoutSec'
    | 'idleResetSec',
    SettingsLimit
  >;
}

export interface DashboardStats {
  activeQuestions: number;
  totalQuestions: number;
  requiredQuestions: number;
  playersOnline: number;
  activeGames: number;
  playersSearching: number;
  gamesToday: number;
  gamesTotal: number;
}

export interface ImportResult {
  imported: number;
}

export interface DeleteResult {
  deleted: number;
}
