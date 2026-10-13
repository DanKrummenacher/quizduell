export type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

export interface AnswerOptionView {
  index: number;
  letter: string;
  text: string;
  state: AnswerState;
  pickedByYou: boolean;
  pickedByOpponent: boolean;
}

export type Feedback =
  | { kind: 'waiting'; text: string }
  | { kind: 'success' | 'error' | 'neutral'; text: string; points: number };

export const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

export function initial(name: string | undefined): string {
  return Array.from((name ?? '?').trim())[0]?.toUpperCase() ?? '?';
}
