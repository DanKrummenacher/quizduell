import { Injectable, signal } from '@angular/core';
import { PLAYER_NAME_MAX_LENGTH } from '../contracts/game.contract';
import { localStore } from '../platform/safe-storage';

const STORAGE_KEY = 'playduelio.playerName';

/** The name the visitor plays with, remembered on this device. */
@Injectable({ providedIn: 'root' })
export class PlayerNameStore {
  private readonly nameSignal = signal(localStore.get(STORAGE_KEY) ?? '');

  readonly name = this.nameSignal.asReadonly();

  set(name: string): void {
    const cleaned = name
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, PLAYER_NAME_MAX_LENGTH);
    this.nameSignal.set(cleaned);
    localStore.set(STORAGE_KEY, cleaned);
  }

  clear(): void {
    this.nameSignal.set('');
    localStore.remove(STORAGE_KEY);
  }
}
