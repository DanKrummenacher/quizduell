import type {
  EndReason,
  ErrorCode,
  GameMode,
  GamePhase,
  GameStateView,
} from '../contracts/game.contract.js';
import type { GameQuestion } from '../questions/questions.service.js';
import type { GameSettings } from '../settings/game-settings.js';

export const COUNTDOWN_MS = 3_000;
/** How long a disconnected player may take to come back before forfeiting. */
export const DISCONNECT_GRACE_MS = 20_000;
/** How long finished or aborted games stay available for the result screen. */
export const SESSION_RETENTION_MS = 10 * 60_000;
/** Friend games nobody joins are removed after this time. */
export const WAITING_TIMEOUT_MS = 30 * 60_000;
export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 100;

export interface Player {
  id: string;
  sessionToken: string;
  name: string;
  socketId: string | null;
  score: number;
  answerIndex: number | null;
  answerTimeMs: number | null;
  lastPoints: number;
  rematchRequested: boolean;
  disconnectTimer: NodeJS.Timeout | null;
}

export interface LastReveal {
  correctIndex: number;
  answers: Map<string, number | null>;
  points: Map<string, number>;
}

export interface Session {
  code: string;
  mode: GameMode;
  phase: GamePhase;
  endReason: EndReason | null;
  players: Player[];
  /** Players who left; kept so the result screen can still show them. */
  departed: Player[];
  settings: GameSettings;
  questions: GameQuestion[];
  questionIndex: number;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  timer: NodeJS.Timeout | null;
  lastReveal: LastReveal | null;
  /** Bumped whenever a new round of the game starts (rematch), guards async work. */
  generation: number;
}

export interface GameNotifier {
  sendState(socketId: string, state: GameStateView): void;
}

export class GameError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

export interface LiveStats {
  activeGames: number;
  playersInGames: number;
  playersSearching: number;
}
