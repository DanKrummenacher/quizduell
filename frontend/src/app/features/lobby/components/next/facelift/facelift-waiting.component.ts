import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';

import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { WaitingLayout } from '../lobby-design';
import { WaitingWComponent } from './waiting-w.component';

const COPIED_FEEDBACK_MS = 1000;

@Component({
  selector: 'app-facelift-waiting',
  imports: [WaitingWComponent],
  templateUrl: './facelift-waiting.component.html',
  styleUrl: './facelift-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftWaitingComponent {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<WaitingLayout>('facelift');
  readonly playerName = input('');
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
