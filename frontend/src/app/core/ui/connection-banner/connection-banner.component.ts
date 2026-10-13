import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/calc-ui-text';
import { GameClient } from '../../game/game-client.service';

/** Shown while the connection to the server is being restored. */
@Component({
  selector: 'app-connection-banner',
  template: `
    @if (visible()) {
      <div class="banner" role="status" aria-live="polite">
        <calc-text textSmall colorWhite
          >Verbindung wird wiederhergestellt...</calc-text
        >
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 900;
      display: flex;
      justify-content: center;
      padding: 0 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem);
      pointer-events: none;
    }
    .banner {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      background-color: #00327d;
      box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.2);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ConnectionBannerComponent {
  private readonly gameClient = inject(GameClient);

  protected readonly visible = computed(
    () =>
      this.gameClient.status() === 'reconnecting' &&
      (this.gameClient.inGame() || this.gameClient.searching()),
  );
}
