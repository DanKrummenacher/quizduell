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
 * TEMPORARY: final candidates for «Spiel erstellt», built exactly like the
 * final search and match screens: visual, title, text, the code, then one
 * action at the same place.
 */
@Component({
  selector: 'app-waiting-final',
  imports: [NgTemplateOutlet],
  templateUrl: './waiting-final.component.html',
  styleUrl: './waiting-final.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class WaitingFinalComponent {
  readonly layout = input.required<WaitingLayout>();
  readonly roomCode = input.required<string>();
  readonly playerName = input('');

  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
  );
  protected readonly isCopied = signal(false);
  protected readonly canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  /** The ring of the search: one tick per second while waiting. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);
  private readonly seconds = signal(0);
  protected readonly filledTicks = computed(() => {
    const seconds = this.seconds();
    return seconds > 0 && seconds % 60 === 0 ? 60 : seconds % 60;
  });
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
