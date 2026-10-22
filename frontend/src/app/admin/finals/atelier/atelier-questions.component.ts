// Atelier: the questions as a table that opens in place.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { type IssueKind, ProposalPro } from '../../proposals/pro';
import { ProposalStore, successRate } from '../../proposals/proposal-store';
import { ImportDialogComponent } from '../../proposals/shared/import-dialog.component';
import { AtelierBulkComponent } from './atelier-bulk.component';
import { AtelierEditorComponent } from './atelier-editor.component';
import { AtelierState, type StatusFilter } from './atelier-state';

type SortKey = 'text' | 'category' | 'rate' | 'asked';

const NONE = '__none__';
const ALL = '__all__';

@Component({
  selector: 'app-atelier-questions',
  imports: [AtelierEditorComponent, AtelierBulkComponent, ImportDialogComponent],
  templateUrl: './atelier-questions.component.html',
  styleUrl: './atelier-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AtelierQuestionsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(AtelierState);

  protected readonly rate = successRate;
  protected readonly none = NONE;
  protected readonly all = ALL;
  protected readonly sort = signal<{ key: SortKey; asc: boolean }>({
    key: 'text',
    asc: true,
  });
  protected readonly importing = signal(false);
  protected readonly issueLabels: Record<IssueKind, string> = {
    hard: 'Zu schwer',
    easy: 'Zu leicht',
    never: 'Nie gestellt',
    duplicate: 'Doppelt',
  };

  protected readonly rows = computed(() => {
    const term = this.state.search().trim().toLowerCase();
    const status = this.state.status();
    const category = this.state.category();
    const issue = this.state.issue();
    const ids = issue
      ? new Set(this.pro.issues().find((i) => i.kind === issue)?.ids)
      : null;
    const list = (this.store.questions() ?? []).filter(
      (q) =>
        (status === 'all' || q.active === (status === 'active')) &&
        (category === null || (q.category ?? '') === category) &&
        (!ids || ids.has(q.id)) &&
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

  protected readonly filtered = computed(
    () =>
      !!this.state.search() ||
      this.state.status() !== 'all' ||
      this.state.category() !== null ||
      this.state.issue() !== null,
  );
  protected readonly allSelected = computed(
    () =>
      this.rows().length > 0 && this.rows().every((q) => this.pro.isSelected(q.id)),
  );
  protected readonly categoryValue = computed(() => {
    const c = this.state.category();
    return c === null ? ALL : c === '' ? NONE : c;
  });

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected setCategory(value: string): void {
    this.state.category.set(value === ALL ? null : value === NONE ? '' : value);
  }

  protected setStatus(value: string): void {
    this.state.status.set(value as StatusFilter);
  }

  protected setIssue(value: string): void {
    this.state.issue.set((value || null) as IssueKind | null);
  }

  protected reset(): void {
    this.state.search.set('');
    this.state.status.set('all');
    this.state.category.set(null);
    this.state.issue.set(null);
  }

  protected toggleSort(key: SortKey): void {
    const s = this.sort();
    this.sort.set({ key, asc: s.key === key ? !s.asc : true });
  }

  protected ariaSort(key: SortKey): string {
    const s = this.sort();
    return s.key === key ? (s.asc ? 'ascending' : 'descending') : 'none';
  }

  protected toggleRow(id: number): void {
    this.state.open.set(this.state.open() === id ? null : id);
  }

  /** Switches a question on or off, with «Rückgängig». */
  protected async setActive(
    question: AdminQuestion,
    active: boolean,
  ): Promise<void> {
    await this.store.setActive(question, active);
    this.state.toast(active ? 'Frage aktiviert' : 'Frage pausiert', () =>
      this.store.setActive({ ...question, active }, !active),
    );
  }
}
