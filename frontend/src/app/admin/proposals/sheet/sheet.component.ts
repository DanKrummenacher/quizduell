// TEMPORARY: proposal I «Tabelle» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import {
  draftFrom,
  emptyDraft,
  hasErrors,
  type QuestionDraft,
  type QuestionErrors,
  validateDraft,
} from '../../questions/question-form';
import {
  apiErrorMessage,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
  successRate,
} from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';

type SortKey = 'text' | 'category' | 'rate' | 'asked';
type RowId = number | 'new';

interface Row {
  id: RowId;
  question: AdminQuestion | null;
  draft: QuestionDraft;
  dirty: boolean;
  errors: QuestionErrors;
}

/**
 * All questions in one grid, edited right in the cells as in a spreadsheet:
 * type, Enter saves the row, Esc undoes it. The correct answer is the cell
 * with the dot. The rules sit in a line above, the totals in a status bar.
 */
@Component({
  selector: 'app-sheet',
  imports: [LogoMarkComponent, ProposalDialogsComponent],
  templateUrl: './sheet.component.html',
  styleUrl: './sheet.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SheetComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly fields = NUMERIC_FIELDS;
  protected readonly sort = signal<{ key: SortKey; asc: boolean } | null>(null);
  protected readonly filter = signal('');
  /** Changed rows that are not saved yet. */
  protected readonly drafts = signal<ReadonlyMap<RowId, QuestionDraft>>(new Map());
  /** Rows whose errors are shown (after a save attempt). */
  protected readonly checked = signal<ReadonlySet<RowId>>(new Set());
  protected readonly savingRow = signal<RowId | null>(null);

  protected readonly rows = computed<Row[]>(() => {
    const drafts = this.drafts();
    const term = this.filter().trim().toLowerCase();
    let list = (this.store.questions() ?? []).filter(
      (q) =>
        !term ||
        [q.text, q.category ?? '', ...q.options].some((v) =>
          v.toLowerCase().includes(term),
        ),
    );
    const sort = this.sort();
    if (sort) {
      const value = (q: AdminQuestion): string | number =>
        sort.key === 'text'
          ? q.text
          : sort.key === 'category'
            ? (q.category ?? '')
            : sort.key === 'rate'
              ? (successRate(q) ?? -1)
              : q.timesAsked;
      list = [...list].sort((a, b) => {
        const x = value(a);
        const y = value(b);
        const result =
          typeof x === 'number' && typeof y === 'number'
            ? x - y
            : String(x).localeCompare(String(y), 'de-CH');
        return sort.asc ? result : -result;
      });
    }
    const rows: Row[] = list.map((question) => this.row(question.id, question));
    if (drafts.has('new')) {
      rows.push(this.row('new', null));
    }
    return rows;
  });

  protected readonly dirtyCount = computed(() => this.drafts().size);
  protected readonly rate = successRate;

  private row(id: RowId, question: AdminQuestion | null): Row {
    const draft =
      this.drafts().get(id) ?? (question ? draftFrom(question) : emptyDraft());
    return {
      id,
      question,
      draft,
      dirty: this.drafts().has(id),
      errors: this.checked().has(id) ? validateDraft(draft) : {},
    };
  }

  protected toggleSort(key: SortKey): void {
    const sort = this.sort();
    this.sort.set(
      sort?.key === key
        ? sort.asc
          ? { key, asc: false }
          : null
        : { key, asc: true },
    );
  }

  protected sortState(key: SortKey): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    return sort?.key === key ? (sort.asc ? 'ascending' : 'descending') : 'none';
  }

  protected edit(row: Row, patch: Partial<QuestionDraft>): void {
    this.drafts.update((map) =>
      new Map(map).set(row.id, { ...row.draft, ...patch }),
    );
  }

  protected editOption(row: Row, index: number, value: string): void {
    const options = [...row.draft.options];
    options[index] = value;
    this.edit(row, { options });
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected addRow(): void {
    this.drafts.update((map) => new Map(map).set('new', emptyDraft()));
  }

  protected revert(row: Row): void {
    this.drafts.update((map) => {
      const next = new Map(map);
      next.delete(row.id);
      return next;
    });
    this.checked.update((set) => {
      const next = new Set(set);
      next.delete(row.id);
      return next;
    });
  }

  protected async save(row: Row): Promise<void> {
    if (!row.dirty) {
      return;
    }
    this.checked.update((set) => new Set(set).add(row.id));
    if (hasErrors(validateDraft(row.draft))) {
      return;
    }
    this.savingRow.set(row.id);
    try {
      await this.store.saveQuestion(row.draft, row.question?.id ?? null);
      this.revert(row);
    } catch (error) {
      this.store.flash('error', apiErrorMessage(error));
    } finally {
      this.savingRow.set(null);
    }
  }

  /** Enter saves the row, Escape undoes its changes. */
  protected onKey(event: KeyboardEvent, row: Row): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.save(row);
    } else if (event.key === 'Escape') {
      this.revert(row);
    }
  }

  protected toggleActive(row: Row): void {
    if (row.question) {
      void this.store.setActive(row.question, !row.question.active);
    } else {
      this.edit(row, { active: !row.draft.active });
    }
  }

  protected setSetting(key: NumericKey, event: Event): void {
    const raw = this.value(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
