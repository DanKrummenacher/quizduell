import { Injectable, signal } from '@angular/core';
import { GAME_CODE_ALPHABET, GAME_CODE_LENGTH } from '../contracts/game.contract';

/** A game code from a shared link (`/?code=K7QX`) waiting to be joined. */
@Injectable({ providedIn: 'root' })
export class JoinIntentStore {
  private readonly codeSignal = signal<string | null>(null);

  readonly code = this.codeSignal.asReadonly();

  setFromLink(raw: string | null | undefined): void {
    const code = (raw ?? '').trim().toUpperCase();
    const valid =
      code.length === GAME_CODE_LENGTH &&
      Array.from(code).every((char) => GAME_CODE_ALPHABET.includes(char));
    if (valid) {
      this.codeSignal.set(code);
    }
  }

  take(): string | null {
    const code = this.codeSignal();
    this.codeSignal.set(null);
    return code;
  }
}

export function joinLink(code: string): string {
  return `${window.location.origin}/?code=${encodeURIComponent(code)}`;
}
