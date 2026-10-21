import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  signal,
} from '@angular/core';

import '@css-ch/components/button';
import '@css-ch/components/icon';

const COPIED_FEEDBACK_MS = 1000;

/**
 * «Spiel erstellt»: the code in the boxes of «Code eingeben», the copy
 * button and a running bar while you wait for your friend.
 */
@Component({
  selector: 'app-lobby-waiting',
  templateUrl: './lobby-waiting.component.html',
  styleUrl: './lobby-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyWaitingComponent {
  readonly roomCode = input.required<string>();

  protected readonly chars = computed(() => Array.from(this.roomCode()));
  protected readonly isCopied = signal(false);

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
