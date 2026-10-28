import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import '@css-ch/components/icon';
import {
  ADMIN_LIMITS,
  type AdminQuestion,
  type HintType,
  type QuestionDay,
  TRASH_DAYS,
} from '../../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../../core/game/answer-letters';
import { AdminApi, messageOf } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  formatDateTime,
  formatDay,
  formatInt,
  formatPercent,
  formatSeconds,
  share,
} from '../../core/format';
import { hintText, MIN_SAMPLE, SEVERITY_LABELS } from '../../core/hint-texts';
import { localStore } from '../../../../core/platform/safe-storage';
import { NotifyService } from '../../core/notify.service';
import { checkQuestion, collapse, hasProblems } from '../../core/question-rules';
import { AdAnswerDistributionComponent } from '../../ui/answer-distribution.component';
import { AdCategoryPickerComponent } from '../../ui/category-picker.component';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdLineChartComponent } from '../../ui/charts';
import { AdStateComponent } from '../../ui/state.component';
import { AdToggleComponent } from '../../ui/toggle.component';

const CHART_KEY = 'playduelio.admin.hint-chart';
const BARS = 20;

interface Draft {
  text: string;
  options: string[];
  correctIndex: number;
  category: string;
  active: boolean;
}

const EMPTY: Draft = {
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  category: '',
  active: true,
};

/** Drawer to write a new question or change one, with its statistics. */
@Component({
  selector: 'app-question-editor',
  imports: [
    AdAnswerDistributionComponent,
    AdCategoryPickerComponent,
    AutofocusDirective,
    AdLineChartComponent,
    AdStateComponent,
    AdToggleComponent,
  ],
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionEditorComponent {
  readonly question = input<AdminQuestion | null>(null);
  readonly creating = input(false);
  /** The address names a question that does not exist (any more). */
  readonly missing = input(false);
  readonly closed = output<void>();
  protected readonly resetNote = computed(() =>
    this.contentChanged()
      ? 'Die Antworten haben sich geändert, die bisherigen Zahlen passen nicht mehr.'
      : 'Antworten und Trefferquote beginnen wieder bei null.',
  );

  private readonly api = inject(AdminApi);
  protected readonly data = inject(AdminData);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);
  private readonly textArea = viewChild<ElementRef<HTMLTextAreaElement>>('textArea');

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = ADMIN_LIMITS;
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly formatInt = formatInt;
  protected readonly formatPercent = formatPercent;
  protected readonly formatSeconds = formatSeconds;
  protected readonly formatDateTime = formatDateTime;

  protected readonly draft = signal<Draft>({
    ...EMPTY,
    options: [...EMPTY.options],
  });
  private original: Draft = { ...EMPTY, options: [...EMPTY.options] };
  protected readonly submitted = signal(false);
  protected readonly touched = signal<ReadonlySet<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** null = follow the suggestion (reset when the content changed). */
  private readonly resetChoice = signal<boolean | null>(null);
  protected readonly history = signal<QuestionDay[] | null>(null);
  private loadedId: number | null = null;

  constructor() {
    // The question may arrive later, when the page was opened by its address.
    effect(() => {
      this.question();
      untracked(() => this.load());
    });
    afterNextRender(() => {
      if (this.creating()) {
        this.textArea()?.nativeElement.focus();
      }
    });
  }

  /** Fills the form once the question is known (also after a reload). */
  private load(): void {
    const question = this.question();
    if (question && question.id !== this.loadedId) {
      this.loadedId = question.id;
      this.original = toDraft(question);
      this.draft.set(toDraft(question));
      void this.api
        .questionHistory(question.id, 30)
        .then((days) => this.history.set(days))
        .catch(() => this.history.set([]));
    }
  }

  protected readonly problems = computed(() =>
    checkQuestion({
      ...this.draft(),
      category: this.draft().category || null,
    }),
  );

  protected show(field: string): boolean {
    return this.submitted() || this.touched().has(field);
  }

  protected touch(field: string): void {
    this.touched.update((all) => new Set([...all, field]));
  }

  protected readonly dirty = computed(() => {
    const draft = this.draft();
    return (
      collapse(draft.text) !== collapse(this.original.text) ||
      draft.options.some(
        (option, i) => collapse(option) !== collapse(this.original.options[i] ?? ''),
      ) ||
      draft.correctIndex !== this.original.correctIndex ||
      collapse(draft.category) !== collapse(this.original.category) ||
      draft.active !== this.original.active
    );
  });

  /** Text, answers or the correct answer changed – the old numbers may not fit. */
  protected readonly contentChanged = computed(() => {
    const draft = this.draft();
    return (
      draft.correctIndex !== this.original.correctIndex ||
      draft.options.some(
        (option, i) =>
          collapse(option).toLocaleLowerCase('de-CH') !==
          collapse(this.original.options[i] ?? '').toLocaleLowerCase('de-CH'),
      )
    );
  });

  protected readonly hasStats = computed(() => {
    const stats = this.question()?.stats;
    return !!stats && stats.answers + stats.timeouts > 0;
  });

  protected readonly resetStats = computed(
    () => this.hasStats() && (this.resetChoice() ?? this.contentChanged()),
  );

  protected setText(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.draft.update((draft) => ({ ...draft, text }));
    this.serverError.set(null);
  }

  protected setOption(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.update((draft) => ({
      ...draft,
      options: draft.options.map((option, i) => (i === index ? value : option)),
    }));
    this.serverError.set(null);
  }

  protected setCorrect(index: number): void {
    this.draft.update((draft) => ({ ...draft, correctIndex: index }));
  }

  protected setCategory(category: string): void {
    this.draft.update((draft) => ({ ...draft, category }));
  }

  protected setActive(active: boolean): void {
    this.draft.update((draft) => ({ ...draft, active }));
  }

  protected setReset(event: Event): void {
    this.resetChoice.set((event.target as HTMLInputElement).checked);
  }

  protected readonly stats = computed(() => {
    const question = this.question();
    if (!question) {
      return null;
    }
    const { answers, correct, timeouts, avgAnswerMs } = question.stats;
    return {
      rate: formatPercent(share(correct, answers)),
      answers: formatInt(answers),
      timeouts: formatPercent(share(timeouts, answers + timeouts)),
      time: formatSeconds(avgAnswerMs),
    };
  });

  protected readonly chart = computed(() => {
    const days = this.history();
    if (!days) {
      return null;
    }
    const answered = days.reduce((sum, day) => sum + day.answers, 0);
    return {
      empty: answered === 0,
      values: days.map((day) => (day.answers ? day.correct / day.answers : null)),
      labels: days.map((day) => formatDay(day.day)),
    };
  });

  /** The open hints of this question, each placed among the pool. */
  protected readonly hints = computed(() => {
    const question = this.question();
    if (!question) {
      return [];
    }
    const pool = (this.data.questions.value() ?? []).filter(
      (other) => other.stats.answers >= MIN_SAMPLE,
    );
    return (this.data.openHints() ?? [])
      .filter((hint) => hint.questionId === question.id)
      .map((hint) => ({
        hint,
        text: hintText(hint, question),
        tone: hint.severity === 'medium' ? 'warning' : 'danger',
        place: placeOf(hint.type, question, pool),
      }));
  });
  protected readonly hintIcons: Partial<Record<HintType, string>> = {
    hard: 'statistic',
    easy: 'statistic',
    timeouts: 'time',
    lure: 'conference',
  };

  /** How the place in the pool is drawn, kept for the next visit. */
  protected readonly chartMode = signal<'line' | 'bars'>(
    localStore.get(CHART_KEY) === 'bars' ? 'bars' : 'line',
  );
  protected setChart(mode: 'line' | 'bars'): void {
    this.chartMode.set(mode);
    localStore.set(CHART_KEY, mode);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.confirm.request()) {
      event.preventDefault();
      void this.close();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void this.save(false);
    }
  }

  protected async close(): Promise<void> {
    if (this.dirty() && !this.missing()) {
      const discard = await this.confirm.ask({
        title: 'Änderungen verwerfen?',
        text: 'Die Änderungen an dieser Frage sind noch nicht gespeichert.',
        confirm: 'Verwerfen',
        danger: true,
      });
      if (!discard) {
        return;
      }
    }
    this.closed.emit();
  }

  /** Saves; `next` keeps the drawer open for the next new question. */
  protected async save(next: boolean): Promise<void> {
    if (this.saving() || this.missing()) {
      return;
    }
    this.submitted.set(true);
    if (hasProblems(this.problems())) {
      // Lead to the first field that needs a correction.
      setTimeout(() =>
        document
          .querySelector<HTMLElement>('.editor [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (!this.creating() && !this.dirty()) {
      this.closed.emit();
      return;
    }
    const draft = this.draft();
    const input = {
      text: draft.text,
      options: draft.options,
      correctIndex: draft.correctIndex,
      category: draft.category.trim() || null,
      active: draft.active,
    };
    this.saving.set(true);
    this.serverError.set(null);
    try {
      const question = this.question();
      if (this.creating() || !question) {
        const created = await this.api.createQuestion(input);
        this.data.replaceQuestion(created);
        this.notify.success(`F-${created.id} erfasst`);
        if (next) {
          this.draft.set({
            ...EMPTY,
            options: [...EMPTY.options],
            category: draft.category,
            active: draft.active,
          });
          this.original = { ...this.draft(), options: [...this.draft().options] };
          this.submitted.set(false);
          this.touched.set(new Set());
          this.textArea()?.nativeElement.focus();
          return;
        }
      } else {
        const updated = await this.api.updateQuestion(question.id, {
          ...input,
          resetStats: this.resetStats(),
        });
        this.original = toDraft(updated);
        this.data.replaceQuestion(updated);
        this.notify.success(
          this.resetStats()
            ? `F-${updated.id} gespeichert, Statistik zurückgesetzt`
            : `F-${updated.id} gespeichert`,
        );
      }
      this.closed.emit();
    } catch (error) {
      this.serverError.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const question = this.question();
    if (!question) {
      return;
    }
    const sure = await this.confirm.ask({
      title: `F-${question.id} löschen?`,
      text: `Die Frage kommt in den Papierkorb und lässt sich dort ${TRASH_DAYS} Tage lang${question.stats.answers > 0 ? ` mit ihrer Statistik (${formatInt(question.stats.answers)} Antworten)` : ''} wiederherstellen. Pausieren nimmt sie nur aus dem Spiel.`,
      confirm: 'Löschen',
      danger: true,
    });
    if (!sure) {
      return;
    }
    try {
      this.saving.set(true);
      await this.api.deleteQuestion(question.id);
      this.data.removeQuestions([question.id]);
      this.notify.success(`F-${question.id} in den Papierkorb gelegt`, {
        label: 'Rückgängig',
        run: () => void this.data.restoreQuestions([question.id]),
      });
      this.original = this.draft();
      this.closed.emit();
    } catch (error) {
      this.serverError.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }
}

function toDraft(question: AdminQuestion): Draft {
  return {
    text: question.text,
    options: [...question.options],
    correctIndex: question.correctIndex,
    category: question.category ?? '',
    active: question.active,
  };
}

/** Where a question stands among the pool, on a scale of 0–100. */
interface Place {
  own: number;
  ownLabel: string;
  max: string;
  zone: { left: number; width: number };
  zoneLabel: string;
  /** The stretch between the target range and the question. */
  gap: { left: number; width: number; text: string } | null;
  /** The question against all questions judged so far, in words. */
  place: string;
  bars: { height: number; zone: boolean; own: boolean }[];
}

const MEASURES: Partial<
  Record<HintType, (question: AdminQuestion) => number | null>
> = {
  hard: ({ stats }) => share(stats.correct, stats.answers),
  easy: ({ stats }) => share(stats.correct, stats.answers),
  timeouts: ({ stats }) => share(stats.timeouts, stats.answers + stats.timeouts),
  lure: ({ stats, correctIndex }) =>
    share(
      Math.max(0, ...stats.picks.filter((_, i) => i !== correctIndex)),
      stats.picks.reduce((sum, n) => sum + n, 0),
    ),
};

function placeOf(
  type: HintType,
  question: AdminQuestion,
  pool: AdminQuestion[],
): Place | null {
  const measure = MEASURES[type];
  const own = measure?.(question) ?? null;
  const values = measure
    ? pool.map(measure).filter((value): value is number => value !== null)
    : [];
  if (own === null || values.length < 5) {
    return null;
  }
  const { picks } = question.stats;
  const zone =
    type === 'timeouts'
      ? { from: 0, to: 0.2 }
      : type === 'lure'
        ? {
            from: 0,
            to:
              share(
                picks[question.correctIndex] ?? 0,
                picks.reduce((sum, n) => sum + n, 0),
              ) ?? 0,
          }
        : { from: 0.3, to: 0.95 };
  const max = type === 'timeouts' ? Math.max(0.4, ...values, own) : 1;
  const at = (value: number) => Math.min(100, (value / max) * 100);
  const below = own < zone.from;
  const above = own > zone.to;
  const points = Math.round(Math.abs((below ? zone.from : zone.to) - own) * 100);
  const beyond = values.filter((value) =>
    type === 'hard' ? value > own : value < own,
  ).length;
  const counted = `${formatPercent(beyond / values.length)} der ${formatInt(values.length)} bewerteten Fragen`;
  const counts = Array<number>(BARS).fill(0);
  for (const value of values) {
    counts[Math.min(BARS - 1, Math.floor((at(value) / 100) * BARS))]! += 1;
  }
  const top = Math.max(1, ...counts);
  const ownBar = Math.min(BARS - 1, Math.floor((at(own) / 100) * BARS));
  return {
    own: at(own),
    ownLabel: formatPercent(own),
    max: formatPercent(max),
    zone: { left: at(zone.from), width: at(zone.to) - at(zone.from) },
    zoneLabel:
      type === 'lure'
        ? `Zielbereich unter der richtigen (${formatPercent(zone.to)})`
        : type === 'timeouts'
          ? `Zielbereich unter ${formatPercent(zone.to)} ohne Antwort`
          : `Zielbereich ${Math.round(zone.from * 100)}–${formatPercent(zone.to)} richtig`,
    gap:
      below || above
        ? {
            left: at(below ? own : zone.to),
            width: below ? at(zone.from) - at(own) : at(own) - at(zone.to),
            text: `${points} Punkte ${below ? 'unter' : 'über'} ${type === 'lure' ? 'der richtigen' : 'dem Zielbereich'}`,
          }
        : null,
    place:
      type === 'hard'
        ? `Schwerer als ${counted}`
        : type === 'easy'
          ? `Leichter als ${counted}`
          : type === 'timeouts'
            ? `Öfter ohne Antwort als ${counted}`
            : `Lockt stärker als bei ${counted}`,
    bars: counts.map((count, i) => {
      const mid = ((i + 0.5) / BARS) * 100;
      return {
        height:
          i === ownBar ? Math.max(18, (count / top) * 100) : (count / top) * 100,
        zone: mid >= at(zone.from) && mid <= at(zone.to),
        own: i === ownBar,
      };
    }),
  };
}
