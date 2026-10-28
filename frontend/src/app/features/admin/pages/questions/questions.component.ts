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
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import '@css-ch/components/icon';
import {
  type AdminQuestion,
  type BulkAction,
  TRASH_DAYS,
} from '../../../../core/contracts/admin.contract';
import { AdminApi, messageOf } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import { download, questionsToCsv } from '../../core/csv';
import { formatInt, formatPercent, formatSeconds, plural } from '../../core/format';
import { DIFFICULTY_LABELS } from '../../core/hint-texts';
import { NotifyService } from '../../core/notify.service';
import { AdStateComponent } from '../../ui/state.component';
import { AdToggleComponent } from '../../ui/toggle.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import { QuestionEditorComponent } from './question-editor.component';
import { QuestionImportComponent } from './question-import.component';
import {
  filterQuestions,
  type HealthFilter,
  hintsByQuestion,
  NO_CATEGORY,
  type QuickId,
  quickFiguresOf,
  rowOf,
  type Sort,
  SORTS,
  type StatusFilter,
  toggled,
  trendText,
} from './question-list';
import { QuestionTrashComponent } from './question-trash.component';

const PAGE_SIZE = 50;
/** A category shows its first questions until opened in full. */
const SHORT_LIST = 3;

/** The question catalogue: find, judge and change questions, one or many. */
@Component({
  selector: 'app-admin-questions',
  imports: [
    NgTemplateOutlet,
    AdPageHeadComponent,
    AdStateComponent,
    AdToggleComponent,
    QuestionEditorComponent,
    QuestionImportComponent,
    QuestionTrashComponent,
  ],
  templateUrl: './questions.component.html',
  styleUrls: [
    './questions.component.scss',
    './questions-chapters.scss',
    './questions-bulk.scss',
  ],
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
  protected readonly trashOpen = signal(false);
  protected readonly trashCount = computed(
    () => this.data.trash.value()?.length ?? 0,
  );
  protected readonly categoryMenu = signal(false);

  /** The selected questions by their state, for the bar. */
  protected readonly selection = computed(() => {
    const selected = this.selected();
    const all = this.data.questions.value() ?? [];
    const picked = all.filter((q) => selected.has(q.id));
    const active = picked.filter((q) => q.active).length;
    const categories = new Set(picked.map((q) => q.category ?? 'Ohne Kategorie'));
    return {
      count: picked.length,
      active,
      paused: picked.length - active,
      categories: [...categories],
    };
  });
  protected readonly newCategory = signal('');

  private readonly destroyRef = inject(DestroyRef);

  /** Quick filters as figures: each sets the filters it stands for. */
  protected readonly quick = computed(() =>
    quickFiguresOf(this.data.questions.value() ?? [], this.hintsByQuestion()),
  );

  protected readonly quickPicked = computed((): QuickId | null => {
    if (this.health() === 'hints') {
      return 'hints';
    }
    if (this.health() === 'hard') {
      return 'hard';
    }
    if (this.health() === 'new') {
      return 'new';
    }
    if (this.status() === 'active') {
      return 'active';
    }
    if (this.status() === 'paused') {
      return 'paused';
    }
    return null;
  });

  protected pickQuick(id: QuickId): void {
    const same = this.quickPicked() === id;
    this.status.set('all');
    this.health.set('all');
    if (same) {
      return;
    }
    if (id === 'active' || id === 'paused') {
      this.status.set(id);
    } else {
      this.health.set(id);
    }
  }

  /** The rows of the page by category, the ones without one last. */
  protected readonly groups = computed(() => {
    const map = new Map<string, ReturnType<typeof this.rows>>();
    for (const row of this.rows()) {
      const key = row.question.category ?? '';
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()]
      .sort(([a], [b]) =>
        a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, 'de-CH'),
      )
      .map(([name, rows]) => {
        const rated = rows.filter((r) => r.rate !== null);
        return {
          name,
          label: name || 'Ohne Kategorie',
          rows,
          active: rows.filter((r) => r.question.active).length,
          average: rated.length
            ? rated.reduce((sum, r) => sum + r.rate!, 0) / rated.length
            : null,
        };
      });
  });

  /** Closed categories, and the ones that show all their questions. */
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  protected readonly fullChapters = signal<ReadonlySet<string>>(new Set());
  protected readonly shortLength = SHORT_LIST;

  protected toggleGroup(name: string): void {
    this.collapsed.update((current) => toggled(current, name));
  }

  protected toggleFull(name: string): void {
    this.fullChapters.update((current) => toggled(current, name));
  }

  /** How much of one category is selected. */
  protected groupSelection(
    rows: { question: AdminQuestion }[],
  ): 'all' | 'some' | 'none' {
    const selected = this.selected();
    const count = rows.filter((r) => selected.has(r.question.id)).length;
    return count === 0 ? 'none' : count === rows.length ? 'all' : 'some';
  }

  /** Selects every question of one category, or none of them. */
  protected toggleGroupRows(rows: { question: AdminQuestion }[]): void {
    const all = this.groupSelection(rows) === 'all';
    this.selected.update((current) => {
      const next = new Set(current);
      for (const row of rows) {
        if (all) {
          next.delete(row.question.id);
        } else {
          next.add(row.question.id);
        }
      }
      return next;
    });
  }

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
      !this.importing() &&
      !this.trashOpen()
    ) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  private readonly hintsByQuestion = computed(() =>
    hintsByQuestion(this.data.openHints() ?? []),
  );

  protected readonly counts = computed(() => {
    const all = this.data.questions.value() ?? [];
    const active = all.filter((q) => q.active).length;
    return { all: all.length, active, paused: all.length - active };
  });

  protected readonly filtered = computed(() =>
    filterQuestions(
      this.data.questions.value() ?? [],
      {
        search: this.search(),
        status: this.status(),
        category: this.category(),
        health: this.health(),
      },
      this.hintsByQuestion(),
      this.sort(),
    ),
  );

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly rows = computed(() => {
    const hints = this.hintsByQuestion();
    const start = this.page() * PAGE_SIZE;
    return this.filtered()
      .slice(start, start + PAGE_SIZE)
      .map((question) => rowOf(question, hints.get(question.id) ?? []));
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

  protected readonly editingQuestion = computed(() => {
    const editing = this.editing();
    return typeof editing === 'number' ? this.data.questionById(editing) : null;
  });

  // ---------------------------------------------------------------------------
  // Filters and selection
  // ---------------------------------------------------------------------------

  protected readonly trendText = trendText;

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
        text: `Die Fragen kommen in den Papierkorb und lassen sich dort ${TRASH_DAYS} Tage lang mit ihrer Statistik wiederherstellen. Wer sie nur vorübergehend aus dem Spiel nehmen will, pausiert sie besser.`,
        confirm: 'Löschen',
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
        delete: 'in den Papierkorb gelegt',
        reset: 'zurückgesetzt',
      };
      this.notify.success(
        `${count} ${labels[action]}`,
        action === 'delete'
          ? {
              label: 'Rückgängig',
              run: () => void this.data.restoreQuestions(ids),
            }
          : undefined,
      );
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
