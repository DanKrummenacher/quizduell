import { DOCUMENT, inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { GameClient } from './game-client.service';
import { isGameScreen } from './game-screen';

/**
 * Ties the game to the page and the visible screen, so nobody plays alone:
 *
 * - A game or search continues only on game screens. Leaving them in any way
 *   (link, back button, typed address, unknown path) ends it at once.
 * - A game stored by an earlier page load is resumed on a game screen (reload)
 *   and left everywhere else.
 * - Pages the browser prerenders while an address is still being typed act
 *   only once they are really shown.
 * - Unloading the page closes the connection on purpose, so the server only
 *   waits briefly for a reload instead of the full grace for network problems.
 */
@Injectable({ providedIn: 'root' })
export class GameLifecycleService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly game = inject(GameClient);
  private firstScreen = true;

  /** Starts watching; called once when the app starts. */
  start(): void {
    this.whenShown(() => {
      const window = this.document.defaultView;
      window?.addEventListener('pagehide', () => this.game.suspend());
      window?.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          // Back from the browser's page cache.
          this.game.reconnect();
        }
      });

      if (this.router.navigated) {
        // The first screen was already routed while the page was prerendered.
        this.onScreenChange();
      }
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.onScreenChange());
    });
  }

  private onScreenChange(): void {
    const onGameScreen = isGameScreen(this.router.routerState.snapshot.root);
    if (this.firstScreen) {
      this.firstScreen = false;
      if (this.game.hasStoredGame()) {
        if (onGameScreen) {
          this.game.resumeStoredGame();
        } else {
          void this.game.leaveStoredGame();
        }
      }
      return;
    }
    if (!onGameScreen && (this.game.inGame() || this.game.searching())) {
      this.game.leave();
    }
  }

  private whenShown(start: () => void): void {
    const document = this.document as Document & { prerendering?: boolean };
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', start, { once: true });
    } else {
      start();
    }
  }
}
