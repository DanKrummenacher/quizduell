import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import '@css-ch/calc-ui-text';

const COPIED_FEEDBACK_MS = 1000;

@Component({
  selector: 'app-lobby-waiting',
  templateUrl: './lobby-waiting.component.html',
  styleUrl: './lobby-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyWaitingComponent {
  readonly roomCode = input.required<string>();

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
