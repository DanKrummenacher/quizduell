import { DOCUMENT, inject, Injectable } from '@angular/core';

interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

/** Keeps the screen on while a game is running (where supported). */
@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private readonly document = inject(DOCUMENT);
  private sentinel: WakeLockSentinelLike | null = null;
  private wanted = false;

  constructor() {
    this.document.addEventListener('visibilitychange', () => {
      if (this.wanted && this.document.visibilityState === 'visible') {
        void this.acquire();
      }
    });
  }

  async enable(): Promise<void> {
    this.wanted = true;
    await this.acquire();
  }

  async disable(): Promise<void> {
    this.wanted = false;
    const sentinel = this.sentinel;
    this.sentinel = null;
    await sentinel?.release().catch(() => undefined);
  }

  private async acquire(): Promise<void> {
    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    if (!wakeLock || this.sentinel) {
      return;
    }
    try {
      const sentinel = await wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) {
          this.sentinel = null;
        }
      });
      this.sentinel = sentinel;
    } catch {
      // Not allowed (e.g. low battery); the game works without it.
    }
  }
}
