export interface GameSessionState {
  gameCode: string;
  players: Record<string, { socketId: string; name: string; score: number }>;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: 'lobby' | 'pre-game' | 'in-game' | 'result';
}

export interface QuestionData {
  text: string;
  options: string[];
  endTimeMs: number;
  totalDurationMs: number;
}

export interface RoundResultData {
  session: GameSessionState;
  correctAnswer: number;
  playerAnswers: Record<string, number | null>;
  nextRoundStartTimeMs: number;
  totalDurationMs: number;
}
