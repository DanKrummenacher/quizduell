// TEMPORARY: proposal J «Workspace», questions with selection and detail (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { type IssueKind, ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { ImportDialogComponent } from '../shared/import-dialog.component';
import { WorkspaceNav } from './workspace-nav';
import { WsInspectorComponent } from './ws-inspector.component';

type SortKey = 'text' | 'category' | 'rate' | 'asked';
type Open = number | 'new' | null;

const NONE = '__none__';

@Component({
  selector: 'app-ws-questions',
  imports: [WsInspectorComponent, ImportDialogComponent],
  templateUrl: './ws-questions.component.html',
  styleUrl: './ws-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WsQuestionsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly nav = inject(WorkspaceNav);

  protected readonly rate = successRate;
  protected readonly none = NONE;
  protected readonly search = signal('');
  protected readonly status = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly category = this.nav.category;
  protected readonly sort = signal<{ key: SortKey; asc: boolean }>({
    key: 'text',
    asc: true,
  });
  protected readonly open = signal<Open>(null);
  protected readonly importing = signal(false);
  protected readonly bulkCategory = signal('');
  protected readonly confirmBulkDelete = signal(false);
  /** Unsaved changes in the detail column, and where the user wanted to go. */
  protected readonly editorDirty = signal(false);
  protected readonly pending = signal<Open | undefined>(undefined);

  protected readonly issueOptions: { value: IssueKind; label: string }[] = [
    { value: 'hard', label: 'Zu schwer' },
    { value: 'easy', label: 'Zu leicht' },
    { value: 'never', label: 'Noch nie gestellt' },
    { value: 'duplicate', label: 'Doppelt' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const category = this.category();
    const issue = this.nav.issue();
    const issueIds = issue
      ? new Set(this.pro.issues().find((i) => i.kind === issue)?.ids)
      : null;
    const list = (this.store.questions() ?? []).filter(
      (q) =>
        (status === 'all' || q.active === (status === 'active')) &&
        (!category || (q.category ?? NONE) === category) &&
        (!issueIds || issueIds.has(q.id)) &&
        (!term ||
          [q.text, q.category ?? '', ...q.options].some((v) =>
            v.toLowerCase().includes(term),
          )),
    );
    const { key, asc } = this.sort();
    const value = (q: AdminQuestion): string | number =>
      key === 'text'
        ? q.text
        : key === 'category'
          ? (q.category ?? '')
          : key === 'rate'
            ? (successRate(q) ?? -1)
            : q.timesAsked;
    return [...list].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const r =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), 'de-CH');
      return asc ? r : -r;
    });
  });

  protected readonly openQuestion = computed(() => {
    const id = this.open();
    return typeof id === 'number'
      ? ((this.store.questions() ?? []).find((q) => q.id === id) ?? null)
      : null;
  });
  protected readonly allSelected = computed(
    () =>
      this.rows().length > 0 && this.rows().every((q) => this.pro.isSelected(q.id)),
  );
  protected readonly filtered = computed(
    () =>
      !!this.search() ||
      this.status() !== 'all' ||
      !!this.category() ||
      !!this.nav.issue(),
  );

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected setIssue(value: string): void {
    this.nav.issue.set((value || null) as IssueKind | null);
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.category.set('');
    this.nav.issue.set(null);
  }

  protected toggleSort(key: SortKey): void {
    const sort = this.sort();
    this.sort.set({ key, asc: sort.key === key ? !sort.asc : true });
  }

  protected ariaSort(key: SortKey): string {
    const sort = this.sort();
    return sort.key === key ? (sort.asc ? 'ascending' : 'descending') : 'none';
  }

  /** Opens a question; unsaved changes are asked about first. */
  protected show(target: Open): void {
    if (this.editorDirty() && target !== this.open()) {
      this.pending.set(target);
    } else {
      this.open.set(target);
    }
  }

  protected leave(): void {
    const target = this.pending();
    this.pending.set(undefined);
    this.editorDirty.set(false);
    this.open.set(target ?? null);
  }

  protected onSaved(question: AdminQuestion): void {
    this.editorDirty.set(false);
    this.open.set(question.id);
  }

  protected async bulkActive(active: boolean): Promise<void> {
    await this.pro.setActiveMany(this.pro.selectedQuestions(), active);
  }

  protected async bulkMove(): Promise<void> {
    const value = this.bulkCategory();
    if (!value) {
      return;
    }
    if (value === '__new__') {
      return;
    }
    await this.pro.setCategoryMany(
      this.pro.selectedQuestions(),
      value === NONE ? null : value,
    );
    this.bulkCategory.set('');
  }

  /** Moves the selection into a new category typed in the bar. */
  protected async moveToNew(name: string): Promise<void> {
    if (name.trim()) {
      await this.pro.setCategoryMany(this.pro.selectedQuestions(), name.trim());
    }
    this.bulkCategory.set('');
  }

  protected async bulkDelete(): Promise<void> {
    await this.pro.deleteMany(this.pro.selectedQuestions());
    this.confirmBulkDelete.set(false);
    if (typeof this.open() === 'number' && !this.openQuestion()) {
      this.open.set(null);
    }
  }
}
