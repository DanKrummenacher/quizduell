// TEMPORARY: proposal J «Workspace», navigation state (development only).
import { Injectable, signal } from '@angular/core';
import type { IssueKind } from '../pro';

export type WorkspaceView = 'overview' | 'questions' | 'categories' | 'rules';

/** The open page of the workspace and the filters other pages can set. */
@Injectable()
export class WorkspaceNav {
  readonly view = signal<WorkspaceView>('overview');
  readonly issue = signal<IssueKind | null>(null);
  /** Category filter of the questions ('' = all). */
  readonly category = signal('');
  readonly menuOpen = signal(false);

  go(view: WorkspaceView, issue: IssueKind | null = null, category = ''): void {
    this.view.set(view);
    this.issue.set(issue);
    this.category.set(category);
    this.menuOpen.set(false);
    window.scrollTo({ top: 0 });
  }
}
