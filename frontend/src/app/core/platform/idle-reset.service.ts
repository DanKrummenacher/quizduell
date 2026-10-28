import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameClient } from '../game/game-client.service';
import { PublicInfoService } from '../info/public-info.service';
import { PlayerNameStore } from '../player/player-name.store';

const ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
] as const;

/**
 * Stand mode: shared devices on site return to the start screen after a period
 * without interaction, so the next visitor starts fresh. Pages opt in while
 * nothing important is happening (never during a running duel).
 */
@Injectable({ providedIn: 'root' })
export class IdleResetService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly gameClient = inject(GameClient);
  private readonly playerName = inject(PlayerNameStore);
  private readonly info = inject(PublicInfoService);

  private readonly armed = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onActivity = () => this.restart();

  constructor() {
    for (const event of ACTIVITY_EVENTS) {
      this.document.addEventListener(event, this.onActivity, {
        passive: true,
        capture: true,
      });
    }
    effect(() => {
      // Re-evaluate when pages arm/disarm or the configured timeout changes.
      this.armed();
      this.info.info();
      this.restart();
    });
  }

  /** Enables the idle reset for as long as the calling page is shown. */
  arm(): void {
    this.armed.set(true);
  }

  disarm(): void {
    this.armed.set(false);
  }

  private restart(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const seconds = this.info.info().idleResetSec;
    if (!this.armed() || seconds <= 0) {
      return;
    }
    this.timer = setTimeout(() => this.reset(), seconds * 1000);
  }

  private reset(): void {
    this.timer = null;
    this.gameClient.leave();
    this.playerName.clear();
    void this.router.navigate(['/']);
  }
}
