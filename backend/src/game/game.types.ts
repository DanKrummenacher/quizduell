import { Question } from '../questions/questions.types';

export const QUESTIONS_PER_GAME = 7;
export const QUESTION_DURATION_MS = 20000;
export const ROUND_RESULT_DURATION_MS = 4000;
export const GAME_CLEANUP_DELAY_MS = 180000;
export const REMATCH_TIMEOUT_MS = 45000;

export interface Player {
  socketId: string;
  name: string;
  score: number;
  currentAnswerIndex?: number | null;
  answerTimeMs?: number | null;
}

export type GameStatus = 'lobby' | 'pre-game' | 'in-game' | 'result';

export interface GameSession {
  gameCode: string;
  players: Record<string, Player>;
  questions: Question[];
  currentQuestionIndex: number;
  status: GameStatus;
  questionStartTimeMs?: number;
  roundTimer?: ReturnType<typeof setTimeout>;
  rematchTimer?: ReturnType<typeof setTimeout>;
  rematchRequests: string[];
}

export interface ClientPlayer {
  socketId: string;
  name: string;
  score: number;
}

export interface ClientSession {
  gameCode: string;
  players: Record<string, ClientPlayer>;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: GameStatus;
}

export interface RoundResultData {
  session: ClientSession;
  correctAnswer: number;
  playerAnswers: Record<string, number | null>;
  nextRoundStartTimeMs: number;
  totalDurationMs: number;
}
