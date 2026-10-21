// TEMPORARY: the tools of the realistic proposals J–L (development only):
// bulk actions, categories, a quality check, CSV and the settings diff.
import { computed, inject, Injectable, signal } from '@angular/core';
import type { AdminQuestion } from '../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../core/game/answer-letters';
import { AdminApi } from '../admin-api.service';
import {
  draftFrom,
  hasErrors,
  type QuestionDraft,
  toInput,
  validateDraft,
} from '../questions/question-form';
import {
  apiErrorMessage,
  durationOf,
  formatDuration,
  NUMERIC_FIELDS,
  ProposalStore,
  successRate,
} from './proposal-store';

/** Answered this often before a question counts as too hard or too easy. */
const MIN_ASKED = 5;
const TOO_HARD = 20;
const TOO_EASY = 90;

export type IssueKind = 'hard' | 'easy' | 'never' | 'duplicate';

export interface Issue {
  kind: IssueKind;
  title: string;
  text: string;
  ids: number[];
}

export interface ImportRow {
  line: number;
  draft: QuestionDraft;
  error: string | null;
  duplicate: boolean;
}

export interface SettingChange {
  label: string;
  before: string;
  after: string;
  /** A result of other changes, e.g. the duration of a duel. */
  derived?: boolean;
}

/** Text without case, spaces and punctuation, to find duplicates. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

const CSV_HEADER = [
  'Frage',
  'Antwort A',
  'Antwort B',
  'Antwort C',
  'Antwort D',
  'Richtig',
  'Kategorie',
  'Aktiv',
];

function csvCell(value: string): string {
  return /[;"\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Splits CSV text into rows of cells; quotes may contain separators. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const separator =
    (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

@Injectable()
export class ProposalPro {
  private readonly api = inject(AdminApi);
  private readonly store = inject(ProposalStore);

  /** Selected questions for bulk actions. */
  readonly selected = signal<ReadonlySet<number>>(new Set());
  /** Progress of a running bulk action, e.g. «3 / 12». */
  readonly progress = signal<{ done: number; total: number } | null>(null);

  readonly selectedQuestions = computed(() =>
    (this.store.questions() ?? []).filter((q) => this.selected().has(q.id)),
  );

  readonly issues = computed<Issue[]>(() => {
    const all = this.store.questions() ?? [];
    const active = all.filter((q) => q.active);
    const rated = active.filter((q) => q.timesAsked >= MIN_ASKED);
    const groups = new Map<string, number[]>();
    for (const q of all) {
      const key = normalize(q.text);
      groups.set(key, [...(groups.get(key) ?? []), q.id]);
    }
    const duplicates = [...groups.values()].filter((ids) => ids.length > 1).flat();
    const issues: Issue[] = [
      {
        kind: 'hard',
        title: 'Zu schwer',
        text: `Weniger als ${TOO_HARD} % richtig, mindestens ${MIN_ASKED}× gestellt`,
        ids: rated.filter((q) => (successRate(q) ?? 0) < TOO_HARD).map((q) => q.id),
      },
      {
        kind: 'easy',
        title: 'Zu leicht',
        text: `Mehr als ${TOO_EASY} % richtig, mindestens ${MIN_ASKED}× gestellt`,
        ids: rated.filter((q) => (successRate(q) ?? 0) > TOO_EASY).map((q) => q.id),
      },
      {
        kind: 'never',
        title: 'Noch nie gestellt',
        text: 'Aktive Fragen, die in keinem Duell kamen',
        ids: active.filter((q) => q.timesAsked === 0).map((q) => q.id),
      },
      {
        kind: 'duplicate',
        title: 'Doppelt',
        text: 'Fragen mit demselben Text',
        ids: duplicates,
      },
    ];
    return issues;
  });

  readonly issueCount = computed(() =>
    this.issues().reduce((sum, issue) => sum + issue.ids.length, 0),
  );

  /** What changes when the rules are saved. */
  readonly settingChanges = computed<SettingChange[]>(() => {
    const before = this.store.settings();
    const after = this.store.form();
    if (!before || !after) {
      return [];
    }
    const changes: SettingChange[] = NUMERIC_FIELDS.filter(
      (f) => before[f.key] !== after[f.key],
    ).map((f) => ({
      label: f.label,
      before: `${before[f.key]}${f.unit ? ' ' + f.unit : ''}`,
      after: `${after[f.key]}${f.unit ? ' ' + f.unit : ''}`,
    }));
    if (before.speedBonusEnabled !== after.speedBonusEnabled) {
      changes.push({
        label: 'Tempo-Bonus',
        before: before.speedBonusEnabled ? 'an' : 'aus',
        after: after.speedBonusEnabled ? 'an' : 'aus',
      });
    }
    const was = durationOf(before);
    const will = durationOf(after);
    if (was !== will && changes.length) {
      changes.push({
        label: 'Dauer eines Duells',
        before: formatDuration(was),
        after: formatDuration(will),
        derived: true,
      });
    }
    return changes;
  });

  readonly changeCount = computed(
    () => this.settingChanges().filter((change) => !change.derived).length,
  );

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  toggle(id: number): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** Selects all given ids, or clears them when all are selected already. */
  toggleAll(ids: number[]): void {
    const all = ids.length > 0 && ids.every((id) => this.selected().has(id));
    this.selected.set(all ? new Set() : new Set(ids));
  }

  clear(): void {
    this.selected.set(new Set());
  }

  // -------------------------------------------------------------------------
  // Bulk actions, one request after the other with progress
  // -------------------------------------------------------------------------
  async setActiveMany(questions: AdminQuestion[], active: boolean): Promise<void> {
    const todo = questions.filter((q) => q.active !== active);
    await this.each(todo, (q) => this.store.setActive(q, active));
    this.store.flash(
      'success',
      `${todo.length} ${todo.length === 1 ? 'Frage' : 'Fragen'} ${active ? 'aktiviert' : 'pausiert'}.`,
    );
  }

  async setCategoryMany(
    questions: AdminQuestion[],
    category: string | null,
  ): Promise<void> {
    const todo = questions.filter((q) => (q.category ?? null) !== category);
    await this.each(todo, async (q) => {
      await this.api.updateQuestion(
        q.id,
        toInput({ ...draftFrom(q), category: category ?? '' }),
      );
    });
    await this.store.loadQuestions();
    this.store.flash(
      'success',
      `${todo.length} ${todo.length === 1 ? 'Frage' : 'Fragen'} nach «${category ?? 'Ohne Kategorie'}» verschoben.`,
    );
  }

  async deleteMany(questions: AdminQuestion[]): Promise<void> {
    await this.each(questions, (q) => this.api.deleteQuestion(q.id));
    await this.store.loadQuestions();
    void this.store.loadStats();
    this.clear();
    this.store.flash(
      'success',
      `${questions.length} ${questions.length === 1 ? 'Frage' : 'Fragen'} gelöscht.`,
    );
  }

  /** Renames a category; with an existing name both are merged. */
  async renameCategory(from: string, to: string): Promise<void> {
    const target = to.trim() || null;
    const questions = (this.store.questions() ?? []).filter(
      (q) => (q.category ?? '') === from,
    );
    await this.setCategoryMany(questions, target);
  }

  async setCategoryActive(name: string, active: boolean): Promise<void> {
    const questions = (this.store.questions() ?? []).filter(
      (q) => (q.category ?? '') === name,
    );
    await this.setActiveMany(questions, active);
  }

  private async each<T>(
    items: T[],
    action: (item: T) => Promise<unknown>,
  ): Promise<void> {
    this.progress.set({ done: 0, total: items.length });
    try {
      for (const item of items) {
        await action(item);
        this.progress.update((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    } catch (error) {
      this.store.flash('error', apiErrorMessage(error));
      await this.store.loadQuestions();
      throw error;
    } finally {
      this.progress.set(null);
    }
  }

  // -------------------------------------------------------------------------
  // CSV
  // -------------------------------------------------------------------------
  exportCsv(questions: AdminQuestion[] = this.store.questions() ?? []): void {
    const lines = [
      CSV_HEADER.join(';'),
      ...questions.map((q) =>
        [
          q.text,
          ...q.options,
          ANSWER_LETTERS[q.correctIndex] ?? 'A',
          q.category ?? '',
          q.active ? 'ja' : 'nein',
        ]
          .map(csvCell)
          .join(';'),
      ),
    ];
    // With a BOM, Excel opens the umlauts correctly.
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `playduelio-fragen-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Reads a CSV file into rows for the preview; nothing is saved yet. */
  readImport(text: string): ImportRow[] {
    const existing = new Set(
      (this.store.questions() ?? []).map((q) => normalize(q.text)),
    );
    const seen = new Set<string>();
    const rows = parseCsv(text.replace(/^\uFEFF/, ''));
    const body =
      rows[0]?.[0]?.trim().toLowerCase() === 'frage' ? rows.slice(1) : rows;
    const offset = body === rows ? 1 : 2;
    return body.map((cells, index) => {
      const letter = (cells[5] ?? 'A').trim().toUpperCase();
      const correctIndex = ANSWER_LETTERS.indexOf(letter);
      const draft: QuestionDraft = {
        text: (cells[0] ?? '').trim(),
        options: [1, 2, 3, 4].map((i) => (cells[i] ?? '').trim()),
        correctIndex: Math.max(0, correctIndex),
        category: (cells[6] ?? '').trim(),
        active: !/^(nein|no|0|false|aus)$/i.test((cells[7] ?? '').trim()),
      };
      const errors = validateDraft(draft);
      const key = normalize(draft.text);
      const duplicate = existing.has(key) || seen.has(key);
      seen.add(key);
      const error =
        correctIndex < 0
          ? `«Richtig» muss A, B, C oder D sein (ist «${letter}»).`
          : hasErrors(errors)
            ? (errors.text ?? errors.options ?? errors.category ?? 'Ungültig')
            : null;
      return { line: index + offset, draft, error, duplicate };
    });
  }

  /** Creates the valid, new rows of an import. */
  async runImport(rows: ImportRow[]): Promise<number> {
    const todo = rows.filter((r) => !r.error && !r.duplicate);
    await this.each(todo, (row) => this.api.createQuestion(toInput(row.draft)));
    await this.store.loadQuestions();
    void this.store.loadStats();
    this.store.flash(
      'success',
      `${todo.length} ${todo.length === 1 ? 'Frage' : 'Fragen'} importiert.`,
    );
    return todo.length;
  }
}
