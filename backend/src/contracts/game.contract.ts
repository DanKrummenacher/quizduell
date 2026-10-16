/**
 * Shared contract between the playduelio backend and frontend.
 *
 * This file exists twice (backend/src/contracts and
 * frontend/src/app/core/contracts) and must stay identical.
 * CI fails if the two copies drift apart.
 */

export const ClientEvents = {
  CREATE_GAME: 'game:create',
  JOIN_GAME: 'game:join',
  START_MATCHMAKING: 'matchmaking:start',
  CANCEL_MATCHMAKING: 'matchmaking:cancel',
  SUBMIT_ANSWER: 'game:answer',
  REQUEST_REMATCH: 'game:rematch',
  LEAVE_GAME: 'game:leave',
  RESUME: 'game:resume',
} as const;

export const ServerEvents = {
  STATE: 'game:state',
} as const;

export const PLAYER_NAME_MAX_LENGTH = 20;
export const GAME_CODE_LENGTH = 4;
export const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ANSWER_OPTION_COUNT = 4;

export type GameMode = 'quick' | 'friend';

export type GamePhase =
  /** Friend game created, waiting for the second player to join. */
  | 'waiting'
  /** Both players present, short countdown before the first question. */
  | 'countdown'
  /** A question is open for answers. */
  | 'question'
  /** The correct answer of the last question is revealed. */
  | 'reveal'
  /** All questions answered, final result is shown. */
  | 'finished'
  /** The game ended early, see `endReason`. */
  | 'aborted';

export type EndReason = 'opponent-left' | 'opponent-disconnected' | 'expired';

/** Where the rematch stands after a finished game, from this player's view. */
export type RematchStatus =
  /** Nobody asked yet, both can ask. */
  | 'open'
  /** You asked and wait for the opponent. */
  | 'requested'
  /** The opponent asked, you can accept. */
  | 'offered'
  /** A connection is interrupted; the rematch waits for the reconnect. */
  | 'paused'
  /** The opponent left, no rematch possible. */
  | 'opponent-left'
  /** You asked, but the opponent did not answer in time. */
  | 'unanswered'
  /** The time for a rematch is over. */
  | 'expired';

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'NAME_REJECTED'
  | 'GAME_NOT_FOUND'
  | 'GAME_FULL'
  | 'OWN_GAME'
  | 'NOT_IN_GAME'
  | 'NOT_ENOUGH_QUESTIONS'
  | 'ANSWER_REJECTED'
  | 'REMATCH_UNAVAILABLE'
  | 'SESSION_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR';

export type Ack<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ErrorCode };

export interface CreateGameRequest {
  playerName: string;
}

export interface JoinGameRequest {
  gameCode: string;
  playerName: string;
}

export interface StartMatchmakingRequest {
  playerName: string;
}

export type MatchmakingStatus = 'matched' | 'queued';

export interface SubmitAnswerRequest {
  questionIndex: number;
  answerIndex: number;
}

export interface ResumeRequest {
  sessionToken: string;
}

export interface LeaveGameRequest {
  /**
   * Leaves the game of this token instead of the socket's current game, e.g.
   * a game stored by an earlier page load that the player navigated away from.
   */
  sessionToken?: string;
}

export interface PlayerView {
  name: string;
  score: number;
  connected: boolean;
  hasAnswered: boolean;
  rematchRequested: boolean;
}

export interface QuestionView {
  index: number;
  text: string;
  options: string[];
}

export interface RevealView {
  correctIndex: number;
  yourAnswerIndex: number | null;
  opponentAnswerIndex: number | null;
  yourPoints: number;
  opponentPoints: number;
}

/** Personalised snapshot of a game, pushed to each player on every change. */
export interface GameStateView {
  gameCode: string;
  /** Secret of this player, used to resume the game after a reconnect. */
  sessionToken: string;
  mode: GameMode;
  phase: GamePhase;
  endReason: EndReason | null;
  you: PlayerView;
  opponent: PlayerView | null;
  questionNumber: number;
  totalQuestions: number;
  question: QuestionView | null;
  reveal: RevealView | null;
  /** Server timestamp (epoch ms) when the current phase ends, if timed. */
  phaseEndsAt: number | null;
  phaseDurationMs: number | null;
  /** Server timestamp (epoch ms) when this snapshot was created. */
  serverNow: number;
  /** Rematch state while the game is `finished`, otherwise `null`. */
  rematch: RematchStatus | null;
}

/** Public game configuration for the start page, served by `GET /api/info`. */
export interface PublicInfo {
  questionsPerGame: number;
  questionDurationSec: number;
  /** Seconds of inactivity before stand devices return to the start screen. */
  idleResetSec: number;
  /** Enough active questions exist to start a duel. */
  playable: boolean;
}
