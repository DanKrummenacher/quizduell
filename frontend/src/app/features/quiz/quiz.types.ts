export type QuizPhase = 'PLAYING' | 'WAITING' | 'REVEAL';

export type FeedbackType = 'default' | 'success' | 'error';

export interface AnswerViewData {
  letter: string;
  text: string;
  state: 'default' | 'selected' | 'correct' | 'wrong';
  hasOpponent: boolean;
}
