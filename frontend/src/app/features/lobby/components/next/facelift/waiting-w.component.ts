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

const COPIED_FEEDBACK_MS = 1000;

/**
 * TEMPORARY: final proposals for «Spiel erstellt» around W1: the same
 * code and copy button, a running light while you wait.
 */
@Component({
  selector: 'app-waiting-w',
  imports: [NgTemplateOutlet],
  templateUrl: './waiting-w.component.html',
  styleUrl: './waiting-w.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class WaitingWComponent {
  readonly layout = input.required<WaitingLayout>();
  readonly roomCode = input.required<string>();

  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly isCopied = signal(false);

  /** How long you have been waiting, as on the search screen. */
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
