// TEMPORARY: proposal L «Klassik», the open page (development only).
import { Injectable, signal } from '@angular/core';

export type ClassicPage =
  | { name: 'overview' }
  | { name: 'questions' }
  | { name: 'question'; id: number | 'new' }
  | { name: 'settings' };

@Injectable()
export class ClassicState {
  readonly page = signal<ClassicPage>({ name: 'overview' });
  /** Filter tab of the list, kept when coming back from a question. */
  readonly tab = signal<'all' | 'active' | 'paused' | 'issues'>('all');
  readonly listPage = signal(0);

  go(page: ClassicPage): void {
    this.page.set(page);
    window.scrollTo({ top: 0 });
  }
}
