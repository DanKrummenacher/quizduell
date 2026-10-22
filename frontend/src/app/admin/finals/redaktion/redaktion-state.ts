// Redaktion: the open page and the question the preview shows.
import { Injectable, signal } from '@angular/core';
import type { QuestionDraft } from '../../questions/question-form';

/** A page of the editor: the start page, the rules, or a category. */
export type RedaktionPage =
  { kind: 'start' } | { kind: 'rules' } | { kind: 'category'; name: string };

@Injectable()
export class RedaktionState {
  readonly page = signal<RedaktionPage>({ kind: 'start' });
  readonly menuOpen = signal(false);
  /** The draft of the block with the cursor, for the preview. */
  readonly focused = signal<QuestionDraft | null>(null);
  readonly importing = signal(false);

  open(page: RedaktionPage): void {
    this.page.set(page);
    this.focused.set(null);
    this.menuOpen.set(false);
    window.scrollTo({ top: 0 });
  }
}
