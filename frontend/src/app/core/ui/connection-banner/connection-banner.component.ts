import { Component, computed, inject } from '@angular/core';
import { GameClient } from '../../game/game-client.service';

/** Thin banner shown while the connection to the server is being restored. */
@Component({
  selector: 'app-connection-banner',
  template: `
    @if (visible()) {
      <div class="banner" role="status" aria-live="polite">
        <span class="dot" aria-hidden="true"></span>
        Verbindung wird wiederhergestellt …
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: auto 0 0 0;
      z-index: var(--css-z-index-toast);
      display: flex;
      justify-content: center;
      padding: 0 var(--app-gutter) calc(var(--app-safe-bottom) + var(--css-space-xs));
      pointer-events: none;
    }
    .banner {
      display: inline-flex;
      align-items: center;
      gap: var(--css-space-2xs);
      padding: var(--css-space-2xs) var(--css-space-xs);
      border-radius: var(--css-border-radius-full);
      background: var(--css-color-surface-warning-strong);
      color: var(--css-color-text-inverse);
      font: var(--css-textstyle-label-md-bold);
      box-shadow: var(--css-effects-shadows-lg);
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1s ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from {
        opacity: 0.3;
      }
      to {
        opacity: 1;
      }
    }
  `,
})
export class ConnectionBannerComponent {
  private readonly gameClient = inject(GameClient);

  protected readonly visible = computed(
    () =>
      this.gameClient.status() === 'reconnecting' &&
      (this.gameClient.inGame() || this.gameClient.searching()),
  );
}
