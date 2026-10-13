import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { GameStateView } from '../../../core/contracts/game.contract';

/** The game ended early. */
@Component({
  selector: 'app-game-aborted',
  template: `
    <span class="badge"><css-icon icon="info" size="2xl" /></span>
    <h1 class="title">{{ message().title }}</h1>
    <p class="text">{{ message().text }}</p>
    <div class="actions">
      <css-button variant="primary" stretch (click)="menu.emit()">
        <css-icon slot="prefix" icon="home" />
        Zum Menü
      </css-button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-block: var(--css-space-md);
    }
    .badge {
      display: grid;
      place-items: center;
      width: 5.5rem;
      height: 5.5rem;
      border-radius: 50%;
      background: var(--css-color-surface-warning);
      color: var(--css-color-text-warning);
    }
    .title {
      margin-top: var(--css-space-xs);
      font-size: clamp(1.5rem, 5vw, 2rem);
      font-weight: var(--css-font-weight-bold);
    }
    .text {
      margin-top: var(--css-space-2xs);
      max-width: 26rem;
      font: var(--css-textstyle-body-md);
      color: var(--css-color-text-strong);
    }
    .actions {
      width: 100%;
      margin-top: var(--css-space-md);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameAbortedComponent {
  readonly state = input.required<GameStateView>();
  readonly menu = output<void>();

  protected readonly message = computed(() => {
    const name = this.state().opponent?.name ?? 'Dein Gegner';
    switch (this.state().endReason) {
      case 'opponent-left':
        return { title: 'Spiel beendet', text: `${name} hat das Spiel verlassen.` };
      case 'opponent-disconnected':
        return {
          title: 'Verbindung verloren',
          text: `Die Verbindung zu ${name} ist abgebrochen. Starte einfach ein neues Duell.`,
        };
      default:
        return {
          title: 'Spiel nicht mehr verfügbar',
          text: 'Dieses Spiel ist leider abgelaufen. Starte einfach ein neues Duell.',
        };
    }
  });
}
