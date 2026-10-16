import { ANSWER_OPTION_COUNT } from '../contracts/game.contract';

/** Letters labelling the answer options: A, B, C, D. */
export const ANSWER_LETTERS: readonly string[] = Array.from(
  { length: ANSWER_OPTION_COUNT },
  (_, index) => String.fromCharCode(65 + index),
);
