import { randomInt } from 'node:crypto';
import { GAME_CODE_ALPHABET, GAME_CODE_LENGTH } from '../contracts/game.contract.js';

export function generateGameCode(isTaken: (code: string) => boolean): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < GAME_CODE_LENGTH; i++) {
      code += GAME_CODE_ALPHABET[randomInt(GAME_CODE_ALPHABET.length)];
    }
    if (!isTaken(code)) {
      return code;
    }
  }
}

export function normalizeGameCode(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const code = raw.trim().toUpperCase();
  const valid =
    code.length === GAME_CODE_LENGTH &&
    Array.from(code).every((char) => GAME_CODE_ALPHABET.includes(char));
  return valid ? code : null;
}
