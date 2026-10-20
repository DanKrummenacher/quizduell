import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { WaitingLayout } from '../lobby-design';

const COPIED_FEEDBACK_MS = 1500;

/**
 * TEMPORARY: «Spiel erstellt» as the counterpart of «Code eingeben» (O1):
 * same structure, spacing and boxes; the code rolls in, the boxes wait.
 */
@Component({
  selector: 'app-waiting-plus',
  imports: [NgTemplateOutlet],
  templateUrl: './waiting-plus.component.html',
  styleUrl: './waiting-plus.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class WaitingPlusComponent {
  readonly layout = input.required<WaitingLayout>();
  readonly roomCode = input.required<string>();
  readonly playerName = input('');

  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
  );
  protected readonly isCopied = signal(false);
  /** Sharing needs the share sheet of the phone (not on every desktop). */
  protected readonly canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  /** X9: how long you have been waiting. */
  private readonly seconds = signal(0);
  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  constructor() {
    const timer = setInterval(() => this.seconds.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected async copyCode(): Promise<void> {
    if (this.isCopied()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.roomCode());
    } catch {
      // Clipboard not available (e.g. insecure context): the code stays visible.
      return;
    }
    this.isCopied.set(true);
    setTimeout(() => this.isCopied.set(false), COPIED_FEEDBACK_MS);
  }

  /** Opens the share sheet of the phone (e.g. WhatsApp) with the code. */
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
