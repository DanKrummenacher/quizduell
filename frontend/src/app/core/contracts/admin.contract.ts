/**
 * Contract of the admin API (`/api/admin/*`).
 *
 * This file exists twice (backend/src/contracts and
 * frontend/src/app/core/contracts) and must stay identical.
 * CI fails if the two copies drift apart.
 */

import type { EndReason, GameMode, GamePhase } from './game.contract.js';

export const ADMIN_LIMITS = {
  questionText: 250,
  optionText: 80,
  category: 50,
  /** Questions accepted by one import. */
  importRows: 1000,
} as const;

// -----------------------------------------------------------------------------
// Session
// -----------------------------------------------------------------------------

export interface AdminLoginRequest {
  password: string;
}

export interface AdminSession {
  token: string;
  /** Epoch ms when the token expires. */
  expiresAt: number;
}

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------

export interface AdminSettings {
  questionsPerGame: number;
  questionDurationSec: number;
  revealDurationSec: number;
  speedBonusEnabled: boolean;
  rematchTimeoutSec: number;
  /** 0 = off. */
  idleResetSec: number;
}

export type NumericSettingKey = Exclude<keyof AdminSettings, 'speedBonusEnabled'>;

export interface AdminSettingsView {
  settings: AdminSettings;
  limits: Record<NumericSettingKey, { min: number; max: number }>;
  defaults: AdminSettings;
  /** ISO timestamp of the last change. */
  updatedAt: string | null;
}

// -----------------------------------------------------------------------------
// Questions
// -----------------------------------------------------------------------------

export interface QuestionInput {
  text: string;
  options: string[];
  correctIndex: number;
  category: string | null;
  active: boolean;
}

export interface QuestionUpdate extends QuestionInput {
  /** Clears the statistics, e.g. after the question was rewritten. */
  resetStats?: boolean;
}

export interface QuestionStats {
  /** Answers given (timeouts not included). */
  answers: number;
  correct: number;
  timeouts: number;
  /** How often each option was picked, in the order of `options`. */
  picks: number[];
  /** Average time to answer, null without answers. */
  avgAnswerMs: number | null;
  /** Answers and correct answers in the last 14 days and the 14 before. */
  recent: { answers: number; correct: number };
  previous: { answers: number; correct: number };
}

export interface AdminQuestion extends QuestionInput {
  id: number;
  createdAt: string;
  updatedAt: string;
  stats: QuestionStats;
}

export interface QuestionDay {
  day: string;
  answers: number;
  correct: number;
  timeouts: number;
}

/** A deleted question, kept so it can be restored. */
export interface TrashedQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  category: string | null;
  /** Answers given while it was in play. */
  answers: number;
  deletedAt: string;
  /** When it is removed for good. */
  expiresAt: string;
}

/** Days a deleted question stays in the trash. */
export const TRASH_DAYS = 30;

export type BulkAction = 'activate' | 'deactivate' | 'delete' | 'category' | 'reset';

export interface BulkRequest {
  ids: number[];
  action: BulkAction;
  /** New category for `category`, null removes it. */
  category?: string | null;
}

export interface BulkResult {
  affected: number;
}

export interface ImportRequest {
  questions: QuestionInput[];
  /** Skips questions whose text already exists (case-insensitive). */
  skipDuplicates: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

/** Days to look back; 0 = everything since the first duel, without a comparison. */
export type AnalyticsRange = 0 | 7 | 30 | 90;

export interface PeriodTotals {
  /** Duels that started and ended in the period. */
  games: number;
  finished: number;
  aborted: number;
  rematches: number;
  answers: number;
  correct: number;
  timeouts: number;
  /** Average duration of finished duels, null without any. */
  avgDurationMs: number | null;
  /** Average answer time, null without answers. */
  avgAnswerMs: number | null;
}

export interface AnalyticsDay {
  day: string;
  finished: number;
  aborted: number;
  answers: number;
  correct: number;
  timeouts: number;
}

export interface CategoryStats {
  category: string | null;
  questions: number;
  active: number;
  answers: number;
  correct: number;
}

export interface Analytics {
  range: AnalyticsRange;
  current: PeriodTotals;
  /** The period of the same length just before. */
  previous: PeriodTotals;
  /** One entry per day of the current period, oldest first. */
  days: AnalyticsDay[];
  /** Same for the previous period, to compare. */
  previousDays: AnalyticsDay[];
  /** Duels per weekday (0 = Monday) and hour, 7 × 24. */
  heatmap: number[][];
  modes: Record<GameMode, number>;
  /** Aborted duels by reason. */
  endReasons: { reason: EndReason; count: number }[];
  /** Aborted duels by the question at which they ended (index 0 = before the first). */
  abortsByQuestion: number[];
  categories: CategoryStats[];
}

// -----------------------------------------------------------------------------
// Live
// -----------------------------------------------------------------------------

export interface LivePlayer {
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
}

export interface LiveAnswer {
  /** Index in the options as shown in this duel, null = no answer. */
  index: number | null;
  ms: number | null;
  points: number;
}

export interface LiveRound {
  questionId: number;
  text: string;
  options: string[];
  correctIndex: number;
  /** One entry per player, same order as `players`. */
  answers: LiveAnswer[];
}

export interface LiveDuel {
  code: string;
  mode: GameMode;
  phase: GamePhase;
  players: LivePlayer[];
  questionNumber: number;
  totalQuestions: number;
  /** Text of the question that is open or revealed right now. */
  currentQuestion: string | null;
  phaseEndsAt: number | null;
  startedAt: number;
  rematch: boolean;
  rounds: LiveRound[];
}

export type LiveEventKind =
  'created' | 'matched' | 'joined' | 'finished' | 'aborted' | 'rematch' | 'expired';

export interface LiveEvent {
  id: number;
  at: number;
  kind: LiveEventKind;
  code: string;
  mode: GameMode;
  names: string[];
  /** Final scores (`finished`) or the reason (`aborted`). */
  scores?: number[];
  reason?: EndReason;
}

export interface LiveSample {
  /** Start of the minute, epoch ms. */
  at: number;
  /** Most duels running at the same time in that minute. */
  games: number;
  players: number;
}

export interface LiveSnapshot {
  serverNow: number;
  /** When the server started, epoch ms; the live history starts there. */
  since: number;
  duels: LiveDuel[];
  searching: { name: string; since: number }[];
  waiting: { code: string; name: string; since: number }[];
  events: LiveEvent[];
  /** One sample per minute, the last 60 minutes, oldest first. */
  history: LiveSample[];
  /** Most duels at the same time since the server started. */
  peak: { games: number; at: number } | null;
  /** No new duels start while true; running duels play to the end. */
  paused: boolean;
}

export interface PauseRequest {
  paused: boolean;
}

// -----------------------------------------------------------------------------
// Hints
// -----------------------------------------------------------------------------

export type HintType =
  /** Fewer active questions than one duel needs. */
  | 'pool-empty'
  /** So few questions that players see them again soon. */
  | 'pool-small'
  /** A wrong answer is picked more often than the correct one. */
  | 'lure'
  /** Almost nobody knows the answer. */
  | 'hard'
  /** Everybody knows the answer. */
  | 'easy'
  /** Many players run out of time. */
  | 'timeouts';

export type HintSeverity = 'critical' | 'high' | 'medium';

export interface Hint {
  /** Stable key, e.g. `lure:12`; used to ignore the hint. */
  key: string;
  type: HintType;
  severity: HintSeverity;
  questionId: number | null;
  /** The measured value that triggered the hint, 0–1 or a count. */
  value: number;
  /** Answers the value is based on. */
  sample: number;
  /** For `lure`: the luring option, index in `options`. */
  optionIndex?: number;
  ignored: boolean;
}

// -----------------------------------------------------------------------------
// Audit log
// -----------------------------------------------------------------------------

export type AuditAction =
  | 'login'
  | 'game.pause'
  | 'game.resume'
  | 'settings.update'
  | 'settings.restore'
  | 'question.create'
  | 'question.update'
  | 'question.delete'
  | 'question.restore'
  | 'trash.purge'
  | 'questions.bulk'
  | 'questions.import'
  | 'hint.ignore'
  | 'hint.restore';

export interface AuditEntry {
  id: number;
  at: string;
  action: AuditAction;
  summary: string;
  /** Settings before and after (`settings.*`), to restore them. */
  before?: AdminSettings;
  after?: AdminSettings;
}

export interface AuditPage {
  entries: AuditEntry[];
  /** Pass as `before` to load older entries; null at the end. */
  nextCursor: number | null;
}
