import { GAME_CODE_ALPHABET } from '../contracts/game.contract.js';
import { generateGameCode, normalizeGameCode } from './game-code.js';

describe('game codes', () => {
  it('generates 4 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateGameCode(() => false);
      expect(code).toHaveLength(4);
      expect(
        Array.from(code).every((char) => GAME_CODE_ALPHABET.includes(char)),
      ).toBe(true);
    }
  });

  it('never returns a code that is already taken', () => {
    const taken = new Set<string>();
    for (let i = 0; i < 500; i++) {
      taken.add(generateGameCode((code) => taken.has(code)));
    }
    expect(taken.size).toBe(500);
  });

  it('normalises user input', () => {
    expect(normalizeGameCode(' ab3k ')).toBe('AB3K');
    expect(normalizeGameCode('AB0K')).toBeNull();
    expect(normalizeGameCode('ABC')).toBeNull();
    expect(normalizeGameCode(1234)).toBeNull();
  });
});
