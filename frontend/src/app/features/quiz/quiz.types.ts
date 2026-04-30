export type QuizPhase = 'PLAYING' | 'WAITING' | 'REVEAL';

export interface AnswerViewData {
  letter: string;
  text: string;
  state: 'default' | 'selected' | 'correct' | 'wrong';
  hasOpponent: boolean;
}
