import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  text: string;
  tone: 'success' | 'error';
  /** Optional action such as «Rückgängig». */
  action?: { label: string; run: () => void };
  /** Temporary: what a pause notice is about, for the drafts. */
  kind?: 'pause' | 'resume';
  detail?: string;
}

/** Short confirmations and errors at the top of the page. */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly notices = signal<Notice[]>([]);

  success(
    text: string,
    action?: Notice['action'],
    extra?: Pick<Notice, 'kind' | 'detail'>,
  ): void {
    this.show({ text, tone: 'success', action, ...extra }, action ? 7000 : 3500);
  }

  error(text: string): void {
    this.show({ text, tone: 'error' }, 6000);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.notices.update((all) => all.filter((notice) => notice.id !== id));
  }

  private show(notice: Omit<Notice, 'id'>, ms: number): void {
    const id = ++this.nextId;
    // At most three at a time; the oldest goes first.
    this.notices.update((all) => [...all.slice(-2), { ...notice, id }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), ms),
    );
  }
}
