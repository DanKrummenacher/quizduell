// Bühne: open tab, the question in the editor and the short notices.
import { Injectable, signal } from '@angular/core';

export type BuehneTab = 'live' | 'questions' | 'rules' | 'more';

@Injectable()
export class BuehneState {
  readonly tab = signal<BuehneTab>('live');
  /** The question in the full-screen editor: id, «new», or closed. */
  readonly editing = signal<number | 'new' | null>(null);
  /** Null = all categories, '' = without category. */
  readonly category = signal<string | null>(null);
  readonly search = signal('');
  readonly onlyIssues = signal(false);
  readonly notice = signal<string | null>(null);
  private noticeTimer = 0;

  go(tab: BuehneTab): void {
    this.tab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  say(text: string): void {
    this.notice.set(text);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => this.notice.set(null), 3_500);
  }
}
