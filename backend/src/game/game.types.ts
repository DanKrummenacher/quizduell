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
  questions: any[];
  currentQuestionIndex: number;
  status: GameStatus;
  questionStartTimeMs?: number;
}
