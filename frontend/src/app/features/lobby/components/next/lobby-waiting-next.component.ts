import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { LobbyDesign } from './lobby-design';

const COPIED_FEEDBACK_MS = 1500;

@Component({
  selector: 'app-lobby-waiting-next',
  template: `
    <div class="screen-content">
      @if (design() === 'facelift') {
        <span class="symbol" aria-hidden="true">
          <css-icon icon="conference" size="lg"></css-icon>
        </span>
      }
      <h1 class="title" [class.spaced]="design() === 'facelift'">Spiel erstellt</h1>
      <p class="subtitle">Teile diesen Code mit deinem Gegner.</p>

      @if (design() === 'facelift') {
        <p class="code-box code-text" aria-label="Spielcode">{{ roomCode() }}</p>
      } @else {
        <p class="code-tiles" aria-label="Spielcode {{ roomCode() }}">
          <span class="visually-hidden code-text">{{ roomCode() }}</span>
          @for (char of chars(); track $index) {
            <span class="code-tile" aria-hidden="true">{{ char }}</span>
          }
        </p>
      }

      <div class="waiting" role="status">
        @if (design() !== 'facelift') {
          <span class="avatar small" aria-hidden="true">{{ initial() }}</span>
          <span class="avatar small is-unknown" aria-hidden="true">?</span>
        }
        <span>Warte auf deinen Gegner&nbsp;…</span>
      </div>
    </div>

    <div class="actions">
      <css-button stretch (click)="copyCode()">
        <css-icon
          [attr.icon]="isCopied() ? 'checked-circle' : 'copy'"
          slot="prefix"
        ></css-icon>
        {{ isCopied() ? 'Code kopiert' : 'Code kopieren' }}
      </css-button>
    </div>
  `,
  styleUrl: './lobby-screen.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyWaitingNextComponent {
  readonly design = input.required<LobbyDesign>();
  readonly roomCode = input.required<string>();
  readonly playerName = input.required<string>();

  protected readonly isCopied = signal(false);
  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );

  protected async copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.roomCode());
    } catch {
      // Clipboard not available (e.g. insecure context): the code stays visible.
      return;
    }
    this.isCopied.set(true);
    setTimeout(() => this.isCopied.set(false), COPIED_FEEDBACK_MS);
  }
}
