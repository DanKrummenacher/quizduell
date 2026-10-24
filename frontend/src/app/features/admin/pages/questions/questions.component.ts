import {
  Component,
  DestroyRef,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AdminQuestion,
  BulkAction,
  Hint,
} from '../../../../core/contracts/admin.contract';
import { AdminApi, AdminApiError } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import { download, questionsToCsv } from '../../core/csv';
import {
  formatInt,
  formatPercent,
  formatSeconds,
  plural,
  share,
} from '../../core/format';
import {
  type Difficulty,
  difficultyOf,
  DIFFICULTY_LABELS,
  HINT_TYPE_LABELS,
} from '../../core/hint-texts';
import { NotifyService } from '../../core/notify.service';
import { AdStateComponent } from '../../ui/state.component';
import { AdToggleComponent } from '../../ui/toggle.component';
import { QuestionEditorComponent } from './question-editor.component';
import { QuestionImportComponent } from './question-import.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';

type StatusFilter = 'all' | 'active' | 'paused';
type HealthFilter = 'all' | 'hints' | Difficulty;
type Sort = 'newest' | 'oldest' | 'rate-asc' | 'rate-desc' | 'answers' | 'text';

const PAGE_SIZE = 50;
const NO_CATEGORY = '__none__';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'newest', label: 'Neueste zuerst' },
  { id: 'oldest', label: 'Älteste zuerst' },
  { id: 'rate-asc', label: 'Trefferquote aufsteigend' },
  { id: 'rate-desc', label: 'Trefferquote absteigend' },
  { id: 'answers', label: 'Am meisten gestellt' },
  { id: 'text', label: 'Frage A–Z' },
];

/** The question catalogue: find, judge and change questions, one or many. */
@Component({
  selector: 'app-admin-questions',
  imports: [
    AdPageHeadComponent,
    AdStateComponent,
    AdToggleComponent,
    QuestionEditorComponent,
    QuestionImportComponent,
  ],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionsComponent {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchBox');

  protected readonly sorts = SORTS;
  protected readonly noCategory = NO_CATEGORY;
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly formatInt = formatInt;
  protected readonly formatPercent = formatPercent;
  protected readonly formatSeconds = formatSeconds;

  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly category = signal<string>('');
  protected readonly health = signal<HealthFilter>('all');
  protected readonly sort = signal<Sort>('newest');
  protected readonly page = signal(0);
  protected readonly selected = signal<ReadonlySet<number>>(new Set());
  protected readonly busy = signal(false);

  /** `new`, a question id, or null; kept in the address (`?frage=12`). */
  protected readonly editing = signal<'new' | number | null>(null);
  protected readonly importing = signal(false);
  protected readonly categoryMenu = signal(false);
  protected readonly newCategory = signal('');

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const value = params.get('frage');
        this.editing.set(
          value === 'neu' ? 'new' : value ? Number(value) || null : null,
        );
        const filter = params.get('filter');
        if (filter === 'hinweise') {
          this.health.set('hints');
        } else if (filter === 'pausiert') {
          this.status.set('paused');
        }
      });
    // A new filter starts at the first page and keeps only visible selections.
    effect(() => {
      this.search();
      this.status();
      this.category();
      this.health();
      this.sort();
      untracked(() => this.page.set(0));
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      target?.closest('input, textarea, select, [contenteditable]') !== null &&
      target !== null;
    if (
      event.key === '/' &&
      !typing &&
      this.editing() === null &&
      !this.importing()
    ) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  private readonly hintsByQuestion = computed(() => {
    const map = new Map<number, Hint[]>();
    for (const hint of this.data.openHints() ?? []) {
      if (hint.questionId !== null) {
        map.set(hint.questionId, [...(map.get(hint.questionId) ?? []), hint]);
      }
    }
    return map;
  });

  protected readonly counts = computed(() => {
    const all = this.data.questions.value() ?? [];
    const active = all.filter((q) => q.active).length;
    return { all: all.length, active, paused: all.length - active };
  });

  protected readonly filtered = computed(() => {
    const all = this.data.questions.value() ?? [];
    const words = this.search()
      .toLocaleLowerCase('de-CH')
      .split(/\s+/)
      .filter(Boolean);
    const status = this.status();
    const category = this.category();
    const health = this.health();
    const hints = this.hintsByQuestion();
    const result = all.filter((q) => {
      if ((status === 'active' && !q.active) || (status === 'paused' && q.active)) {
        return false;
      }
      if (
        category === NO_CATEGORY
          ? q.category !== null
          : category && q.category !== category
      ) {
        return false;
      }
      if (health === 'hints' && !hints.has(q.id)) {
        return false;
      }
      if (health !== 'all' && health !== 'hints' && difficultyOf(q) !== health) {
        return false;
      }
      if (words.length) {
        const haystack = [
          q.text,
          ...q.options,
          q.category ?? '',
          `f-${q.id}`,
          String(q.id),
        ]
          .join(' ')
          .toLocaleLowerCase('de-CH');
        return words.every((word) => haystack.includes(word));
      }
      return true;
    });
    return sortQuestions(result, this.sort());
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly rows = computed(() => {
    const hints = this.hintsByQuestion();
    const start = this.page() * PAGE_SIZE;
    return this.filtered()
      .slice(start, start + PAGE_SIZE)
      .map((question) => {
        const { answers, correct, recent, previous } = question.stats;
        const rate = share(correct, answers);
        const recentRate = share(recent.correct, recent.answers);
        const previousRate = share(previous.correct, previous.answers);
        const trend =
          recentRate !== null &&
          previousRate !== null &&
          recent.answers >= 10 &&
          previous.answers >= 10
            ? recentRate - previousRate
            : null;
        return {
          question,
          rate,
          trend,
          difficulty: difficultyOf(question),
          hints: (hints.get(question.id) ?? []).map(
            (hint) => HINT_TYPE_LABELS[hint.type],
          ),
        };
      });
  });

  protected readonly range = computed(() => {
    const total = this.filtered().length;
    const start = this.page() * PAGE_SIZE;
    return {
      from: total ? start + 1 : 0,
      to: Math.min(start + PAGE_SIZE, total),
      total,
    };
  });

  protected readonly filtersActive = computed(
    () =>
      this.search() !== '' ||
      this.status() !== 'all' ||
      this.category() !== '' ||
      this.health() !== 'all',
  );

  protected readonly visibleIds = computed(() =>
    this.rows().map((row) => row.question.id),
  );

  protected readonly allVisibleSelected = computed(() => {
    const ids = this.visibleIds();
    const selected = this.selected();
    return ids.length > 0 && ids.every((id) => selected.has(id));
  });

  protected readonly someVisibleSelected = computed(() => {
    const selected = this.selected();
    return (
      this.visibleIds().some((id) => selected.has(id)) && !this.allVisibleSelected()
    );
  });

  protected readonly editingQuestion = computed(() => {
    const editing = this.editing();
    return typeof editing === 'number' ? this.data.questionById(editing) : null;
  });

  // ---------------------------------------------------------------------------
  // Filters and selection
  // ---------------------------------------------------------------------------

  /** Change in percentage points: «+5 Pkt.» */
  protected trendText(trend: number): string {
    const points = Math.round(trend * 100);
    return `${points > 0 ? '+' : points < 0 ? '−' : '±'}${Math.abs(points)} Pkt.`;
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onSelect<T extends string>(
    target: (value: T) => void,
    event: Event,
  ): void {
    target((event.target as HTMLSelectElement).value as T);
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.category.set('');
    this.health.set('all');
  }

  protected toggleRow(id: number, event?: Event): void {
    event?.stopPropagation();
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected toggleAllVisible(): void {
    const ids = this.visibleIds();
    this.selected.update((current) => {
      const next = new Set(current);
      if (this.allVisibleSelected()) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  protected selectAllFiltered(): void {
    this.selected.set(new Set(this.filtered().map((q) => q.id)));
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
    this.categoryMenu.set(false);
  }

  protected goToPage(page: number): void {
    this.page.set(Math.min(Math.max(page, 0), this.pageCount() - 1));
    document.querySelector('.questions-table')?.scrollIntoView({ block: 'start' });
  }

  // ---------------------------------------------------------------------------
  // Editor and import
  // ---------------------------------------------------------------------------

  protected open(target: 'new' | number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { frage: target === 'new' ? 'neu' : target },
      queryParamsHandling: 'merge',
    });
  }

  protected closeEditor(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { frage: null },
      queryParamsHandling: 'merge',
    });
  }

  protected exportCsv(): void {
    const selected = this.selected();
    const all = this.data.questions.value() ?? [];
    const questions = selected.size ? all.filter((q) => selected.has(q.id)) : all;
    const day = new Date().toISOString().slice(0, 10);
    download(`playduelio-fragen-${day}.csv`, questionsToCsv(questions));
    this.notify.success(`${plural(questions.length, 'Frage', 'Fragen')} exportiert`);
  }

  // ---------------------------------------------------------------------------
  // Changes
  // ---------------------------------------------------------------------------

  protected async setActive(
    question: AdminQuestion,
    active: boolean,
  ): Promise<void> {
    const done = await this.runBulk(
      [question.id],
      active ? 'activate' : 'deactivate',
    );
    if (done) {
      this.notify.success(
        active
          ? `F-${question.id} ist wieder im Spiel`
          : `F-${question.id} pausiert`,
        {
          label: 'Rückgängig',
          run: () =>
            void this.runBulk([question.id], active ? 'deactivate' : 'activate'),
        },
      );
    }
  }

  protected async bulk(action: Exclude<BulkAction, 'category'>): Promise<void> {
    const ids = [...this.selected()];
    if (!ids.length) {
      return;
    }
    const count = plural(ids.length, 'Frage', 'Fragen');
    if (action === 'delete') {
      const sure = await this.confirm.ask({
        title: `${count} löschen?`,
        text: 'Die Fragen und ihre Statistik werden endgültig gelöscht. Wer sie nur vorübergehend aus dem Spiel nehmen will, pausiert sie besser.',
        confirm: 'Endgültig löschen',
        danger: true,
      });
      if (!sure) {
        return;
      }
    }
    if (action === 'reset') {
      const sure = await this.confirm.ask({
        title: `Statistik von ${count} zurücksetzen?`,
        text: 'Antworten, Trefferquote und Verlauf dieser Fragen beginnen wieder bei null. Sinnvoll, wenn Fragen grundlegend überarbeitet wurden.',
        confirm: 'Zurücksetzen',
        danger: true,
      });
      if (!sure) {
        return;
      }
    }
    const done = await this.runBulk(ids, action);
    if (done) {
      const labels: Record<typeof action, string> = {
        activate: 'aktiviert',
        deactivate: 'pausiert',
        delete: 'gelöscht',
        reset: 'zurückgesetzt',
      };
      this.notify.success(`${count} ${labels[action]}`);
      if (action === 'delete') {
        this.clearSelection();
      }
    }
  }

  protected async moveToCategory(category: string | null): Promise<void> {
    const ids = [...this.selected()];
    const value = category?.trim() ? category.trim() : null;
    this.categoryMenu.set(false);
    this.newCategory.set('');
    if (!ids.length) {
      return;
    }
    try {
      this.busy.set(true);
      await this.api.bulk({ ids, action: 'category', category: value });
      await this.data.reloadQuestions();
      this.notify.success(
        value
          ? `${plural(ids.length, 'Frage', 'Fragen')} in «${value}» verschoben`
          : `Kategorie bei ${plural(ids.length, 'Frage', 'Fragen')} entfernt`,
      );
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected onNewCategory(event: Event): void {
    this.newCategory.set((event.target as HTMLInputElement).value);
  }

  private async runBulk(ids: number[], action: BulkAction): Promise<boolean> {
    try {
      this.busy.set(true);
      await this.api.bulk({ ids, action });
      if (action === 'delete') {
        this.data.removeQuestions(ids);
        this.selected.update((current) => {
          const next = new Set(current);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        await this.data.reloadQuestions();
      }
      return true;
    } catch (error) {
      this.notify.error(messageOf(error));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}

function sortQuestions(questions: AdminQuestion[], sort: Sort): AdminQuestion[] {
  const rate = (q: AdminQuestion) =>
    q.stats.answers > 0 ? q.stats.correct / q.stats.answers : null;
  const byRate = (direction: 1 | -1) => (a: AdminQuestion, b: AdminQuestion) => {
    const ra = rate(a);
    const rb = rate(b);
    // Questions without answers always go last.
    if (ra === null || rb === null) {
      return ra === null ? (rb === null ? 0 : 1) : -1;
    }
    return (ra - rb) * direction;
  };
  const sorted = [...questions];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id);
    case 'oldest':
      return sorted.sort((a, b) => a.id - b.id);
    case 'rate-asc':
      return sorted.sort(byRate(1));
    case 'rate-desc':
      return sorted.sort(byRate(-1));
    case 'answers':
      return sorted.sort((a, b) => b.stats.answers - a.stats.answers);
    case 'text':
      return sorted.sort((a, b) => a.text.localeCompare(b.text, 'de-CH'));
  }
}

export function messageOf(error: unknown): string {
  return error instanceof AdminApiError ? error.message : 'Das hat nicht geklappt.';
}
