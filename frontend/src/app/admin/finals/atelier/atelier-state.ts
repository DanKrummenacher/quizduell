// Atelier: navigation, filters and the toasts with «Rückgängig».
import { Injectable, signal } from '@angular/core';
import type { IssueKind } from '../../proposals/pro';

export type AtelierView = 'overview' | 'questions' | 'rules';
export type StatusFilter = 'all' | 'active' | 'paused';

export interface AtelierToast {
  id: number;
  text: string;
  undo?: () => void | Promise<void>;
}

const TOAST_MS = 6_000;

@Injectable()
export class AtelierState {
  readonly view = signal<AtelierView>('overview');
  readonly menuOpen = signal(false);
  readonly paletteOpen = signal(false);

  // Filters of the question table.
  readonly search = signal('');
  readonly status = signal<StatusFilter>('all');
  /** Null = all, '' = without category. */
  readonly category = signal<string | null>(null);
  readonly issue = signal<IssueKind | null>(null);
  /** The open row: a question id, «new» for the new row, or none. */
  readonly open = signal<number | 'new' | null>(null);

  readonly toasts = signal<AtelierToast[]>([]);
  private nextToast = 1;

  go(view: AtelierView): void {
    this.view.set(view);
    this.menuOpen.set(false);
    window.scrollTo({ top: 0 });
  }

  /** Opens the questions with a filter, e.g. from the overview. */
  showQuestions(
    filter: {
      category?: string | null;
      issue?: IssueKind | null;
      status?: StatusFilter;
    } = {},
  ): void {
    this.search.set('');
    this.category.set(filter.category ?? null);
    this.issue.set(filter.issue ?? null);
    this.status.set(filter.status ?? 'all');
    this.open.set(null);
    this.go('questions');
  }

  newQuestion(): void {
    this.go('questions');
    this.open.set('new');
  }

  toast(text: string, undo?: AtelierToast['undo']): void {
    const id = this.nextToast++;
    this.toasts.update((list) => [...list.slice(-2), { id, text, undo }]);
    setTimeout(() => this.dismiss(id), TOAST_MS);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
