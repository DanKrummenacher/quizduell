import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { WaitingLayout } from '../lobby-design';

const COPIED_FEEDBACK_MS = 1500;

/** TEMPORARY: small refinements of today's «Spiel erstellt». */
@Component({
  selector: 'app-waiting-small',
  templateUrl: './waiting-small.component.html',
  styleUrl: './waiting-small.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class WaitingSmallComponent {
  readonly layout = input.required<WaitingLayout>();
  readonly roomCode = input.required<string>();

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
