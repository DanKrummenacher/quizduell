import { Question } from '../questions/schemas/question.schema';

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
  players: Record<string, Player>; // Map socketId -> Player
  questions: any[]; // In a real app this would be populated from MongoDB
  currentQuestionIndex: number;
  status: GameStatus;
  questionStartTimeMs?: number;
}
