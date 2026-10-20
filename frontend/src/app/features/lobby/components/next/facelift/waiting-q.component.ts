import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { WaitingLayout } from '../lobby-design';

const COPIED_FEEDBACK_MS = 1500;

/**
 * TEMPORARY: «Spiel erstellt» around one prominent code card (as Jackbox,
 * Kahoot or Spotify Jam): the code large, the actions right at the card,
 * a calm live hint; no greeting above.
 */
@Component({
  selector: 'app-waiting-q',
  imports: [NgTemplateOutlet],
  templateUrl: './waiting-q.component.html',
  styleUrl: './waiting-q.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class WaitingQComponent {
  readonly layout = input.required<WaitingLayout>();
  readonly roomCode = input.required<string>();
  readonly playerName = input('');

  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
  );
  protected readonly isDark = computed(() => this.layout() === 'q-dark');
  protected readonly isCopied = signal(false);
  protected readonly canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  protected async copyCode(): Promise<void> {
    if (this.isCopied()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.roomCode());
    } catch {
      return;
    }
    this.isCopied.set(true);
    setTimeout(() => this.isCopied.set(false), COPIED_FEEDBACK_MS);
  }

  protected async shareCode(): Promise<void> {
    try {
      await navigator.share({
        title: 'playduelio',
        text: `Spiel ein Duell gegen mich auf playduelio! Code: ${this.roomCode()}`,
      });
    } catch {
      // Closed by the user or not possible: nothing to do.
    }
  }
}
