import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  text: string;
  confirm: string;
  /** Red confirm button for actions that cannot be undone. */
  danger?: boolean;
}

/** Asks before something irreversible happens; one question at a time. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);
  private resolve: ((answer: boolean) => void) | null = null;

  ask(request: ConfirmRequest): Promise<boolean> {
    this.resolve?.(false);
    this.request.set(request);
    return new Promise((resolve) => (this.resolve = resolve));
  }

  answer(value: boolean): void {
    this.resolve?.(value);
    this.resolve = null;
    this.request.set(null);
  }
}
