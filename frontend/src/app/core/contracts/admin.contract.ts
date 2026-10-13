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

export interface AdminSettings {
  questionsPerGame: number;
  questionDurationSec: number;
  revealDurationSec: number;
  speedBonusEnabled: boolean;
  rematchTimeoutSec: number;
  idleResetSec: number;
}

export interface SettingsLimit {
  min: number;
  max: number;
}

export interface AdminSettingsResponse {
  settings: AdminSettings;
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
