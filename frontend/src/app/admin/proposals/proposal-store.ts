// TEMPORARY: shared data and actions of the admin proposals (development only).
import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type {
  AdminQuestion,
  AdminSettings,
  AdminSettingsResponse,
  DashboardStats,
  SettingsLimit,
} from '../../core/contracts/admin.contract';
import { AdminApi } from '../admin-api.service';
import type { AdminMessage } from '../admin-message';
import {
  draftFrom,
  emptyDraft,
  type QuestionDraft,
  toInput,
} from '../questions/question-form';

/** Countdown before the first question and the points, see the game engine. */
export const COUNTDOWN_SEC = 3;
export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 100;
const REFRESH_MS = 5_000;

export type StatusFilter = 'all' | 'active' | 'inactive';
export type NumericKey = Exclude<keyof AdminSettings, 'speedBonusEnabled'>;

export interface NumericField {
  key: NumericKey;
  label: string;
  short: string;
  unit: string;
  hint: string;
}

export const NUMERIC_FIELDS: NumericField[] = [
  {
    key: 'questionsPerGame',
    label: 'Fragen pro Duell',
    short: 'Fragen',
    unit: '',
    hint: 'Wie viele Fragen ein Duell hat.',
  },
  {
    key: 'questionDurationSec',
    label: 'Sekunden pro Frage',
    short: 'Antwortzeit',
    unit: 's',
    hint: 'Zeit, um eine Frage zu beantworten.',
  },
  {
    key: 'revealDurationSec',
    label: 'Sekunden für die Auflösung',
    short: 'Auflösung',
    unit: 's',
    hint: 'Wie lange die richtige Antwort angezeigt wird.',
  },
  {
    key: 'rematchTimeoutSec',
    label: 'Sekunden für die Revanche',
    short: 'Revanche',
    unit: 's',
    hint: 'Zeit zum Fordern einer Revanche; nach einer Anfrage beginnt sie für die Antwort neu.',
  },
  {
    key: 'idleResetSec',
    label: 'Zurücksetzen nach Sekunden',
    short: 'Stand-Modus',
    unit: 's',
    hint: 'Stand-Geräte springen nach dieser Zeit ohne Bedienung zur Startseite zurück. 0 = aus.',
  },
];

export interface CategoryStat {
  name: string;
  total: number;
  active: number;
  /** Share of correct answers in percent, null if never asked. */
  rate: number | null;
}

export interface TimelineSegment {
  kind: 'countdown' | 'question' | 'reveal';
  seconds: number;
  label: string;
}

/** Share of correct answers in percent, null if never asked. */
export function successRate(question: AdminQuestion): number | null {
  return question.timesAsked === 0
    ? null
    : Math.round((question.timesCorrect / question.timesAsked) * 100);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0
    ? `${minutes}:${String(rest).padStart(2, '0')} Min.`
    : `${rest} Sek.`;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Der Server ist nicht erreichbar.';
    }
    if (error.status === 400) {
      return 'Die Eingaben sind ungültig. Bitte prüfe alle Felder.';
    }
    if (error.status === 404) {
      return 'Diese Frage gibt es nicht mehr.';
    }
  }
  return 'Das hat nicht geklappt. Bitte versuche es nochmals.';
}

/** Everything the admin needs, loaded once and kept live. */
@Injectable()
export class ProposalStore {
  private readonly api = inject(AdminApi);

  readonly stats = signal<DashboardStats | null>(null);
  readonly statsError = signal(false);
  readonly updatedAt = signal<Date | null>(null);
  readonly questions = signal<AdminQuestion[] | null>(null);
  readonly questionsError = signal(false);
  readonly settingsResponse = signal<AdminSettingsResponse | null>(null);
  readonly form = signal<AdminSettings | null>(null);
  readonly message = signal<AdminMessage | null>(null);
  readonly busy = signal(false);
  readonly saving = signal(false);

  /** The question in the editor dialog: null closed, id null for a new one. */
  readonly editing = signal<{ draft: QuestionDraft; id: number | null } | null>(
    null,
  );
  readonly editorError = signal('');
  /** The open confirmation for deleting. */
  readonly confirm = signal<
    { kind: 'delete'; question: AdminQuestion } | { kind: 'delete-all' } | null
  >(null);

  // Filters of the question list.
  readonly search = signal('');
  readonly status = signal<StatusFilter>('all');
  /** Null = all categories, '' = without category. */
  readonly category = signal<string | null>(null);

  readonly ready = computed(() => {
    const stats = this.stats();
    return stats ? stats.activeQuestions >= stats.requiredQuestions : null;
  });
  readonly missingQuestions = computed(() => {
    const stats = this.stats();
    return stats ? Math.max(0, stats.requiredQuestions - stats.activeQuestions) : 0;
  });

  readonly counts = computed(() => {
    const all = this.questions() ?? [];
    const active = all.filter((q) => q.active).length;
    return { total: all.length, active, inactive: all.length - active };
  });

  readonly categories = computed(() => {
    const names = new Set<string>();
    for (const question of this.questions() ?? []) {
      if (question.category) {
        names.add(question.category);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'de-CH'));
  });

  readonly categoryStats = computed<CategoryStat[]>(() => {
    const groups = new Map<string, AdminQuestion[]>();
    for (const question of this.questions() ?? []) {
      const name = question.category ?? '';
      groups.set(name, [...(groups.get(name) ?? []), question]);
    }
    return [...groups.entries()]
      .map(([name, list]) => {
        const asked = list.reduce((sum, q) => sum + q.timesAsked, 0);
        const correct = list.reduce((sum, q) => sum + q.timesCorrect, 0);
        return {
          name,
          total: list.length,
          active: list.filter((q) => q.active).length,
          rate: asked === 0 ? null : Math.round((correct / asked) * 100),
        };
      })
      .sort((a, b) =>
        a.name === ''
          ? 1
          : b.name === ''
            ? -1
            : a.name.localeCompare(b.name, 'de-CH'),
      );
  });

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const category = this.category();
    return (this.questions() ?? []).filter((question) => {
      if (status === 'active' && !question.active) {
        return false;
      }
      if (status === 'inactive' && question.active) {
        return false;
      }
      if (category !== null && (question.category ?? '') !== category) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [question.text, question.category ?? '', ...question.options].some(
        (value) => value.toLowerCase().includes(term),
      );
    });
  });

  /** Answered often enough to say something about the difficulty. */
  readonly hardest = computed(() =>
    (this.questions() ?? [])
      .filter((q) => q.active && q.timesAsked >= 3)
      .sort((a, b) => (successRate(a) ?? 0) - (successRate(b) ?? 0))
      .slice(0, 3),
  );
  readonly neverAsked = computed(
    () =>
      (this.questions() ?? []).filter((q) => q.active && q.timesAsked === 0).length,
  );
  readonly overallRate = computed(() => {
    const all = this.questions() ?? [];
    const asked = all.reduce((sum, q) => sum + q.timesAsked, 0);
    const correct = all.reduce((sum, q) => sum + q.timesCorrect, 0);
    return asked === 0 ? null : Math.round((correct / asked) * 100);
  });
  readonly answersTotal = computed(() =>
    (this.questions() ?? []).reduce((sum, q) => sum + q.timesAsked, 0),
  );

  // Settings.
  readonly settings = computed(() => this.settingsResponse()?.settings ?? null);
  readonly errors = computed(() => {
    const form = this.form();
    const limits = this.settingsResponse()?.limits;
    const errors: Partial<Record<NumericKey, string>> = {};
    if (!form || !limits) {
      return errors;
    }
    for (const field of NUMERIC_FIELDS) {
      const value = form[field.key];
      const limit: SettingsLimit = limits[field.key];
      if (!Number.isInteger(value) || value < limit.min || value > limit.max) {
        errors[field.key] = `Erlaubt sind ${limit.min} bis ${limit.max}.`;
      }
    }
    return errors;
  });
  readonly valid = computed(() => Object.keys(this.errors()).length === 0);
  readonly dirty = computed(
    () => JSON.stringify(this.form()) !== JSON.stringify(this.settings()),
  );
  readonly isDefault = computed(
    () =>
      JSON.stringify(this.form()) ===
      JSON.stringify(this.settingsResponse()?.defaults),
  );
  readonly questionWarning = computed(() => {
    const active = this.stats()?.activeQuestions;
    const required = this.form()?.questionsPerGame;
    return active !== undefined && required !== undefined && active < required
      ? `Es gibt nur ${active} aktive Fragen – mit ${required} Fragen pro Duell kann nicht gespielt werden.`
      : null;
  });
  readonly gameSeconds = computed(() => durationOf(this.form()));
  readonly maxPoints = computed(() => {
    const f = this.form();
    return f
      ? f.questionsPerGame *
          (BASE_POINTS + (f.speedBonusEnabled ? MAX_SPEED_BONUS : 0))
      : 0;
  });
  readonly timeline = computed<TimelineSegment[]>(() => {
    const f = this.form();
    if (!f || !this.valid()) {
      return [];
    }
    const segments: TimelineSegment[] = [
      { kind: 'countdown', seconds: COUNTDOWN_SEC, label: 'Start' },
    ];
    for (let i = 1; i <= f.questionsPerGame; i++) {
      segments.push({
        kind: 'question',
        seconds: f.questionDurationSec,
        label: `Frage ${i}`,
      });
      segments.push({
        kind: 'reveal',
        seconds: f.revealDurationSec,
        label: 'Auflösung',
      });
    }
    return segments;
  });

  constructor() {
    void this.loadAll();
    const timer = setInterval(() => void this.loadStats(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async loadAll(): Promise<void> {
    await Promise.all([this.loadStats(), this.loadQuestions(), this.loadSettings()]);
  }

  async loadStats(): Promise<void> {
    try {
      this.stats.set(await this.api.dashboard());
      this.updatedAt.set(new Date());
      this.statsError.set(false);
    } catch {
      this.statsError.set(true);
    }
  }

  async loadQuestions(): Promise<void> {
    try {
      this.questions.set(await this.api.questions());
      this.questionsError.set(false);
    } catch {
      this.questionsError.set(true);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const response = await this.api.settings();
      this.settingsResponse.set(response);
      this.form.set({ ...response.settings });
    } catch {
      this.flash('error', 'Die Einstellungen konnten nicht geladen werden.');
    }
  }

  /** Saves a new (id null) or changed question; returns it, or throws. */
  async saveQuestion(
    draft: QuestionDraft,
    id: number | null,
    { quiet = false } = {},
  ): Promise<AdminQuestion> {
    const input = toInput(draft);
    const saved =
      id === null
        ? await this.api.createQuestion(input)
        : await this.api.updateQuestion(id, input);
    this.upsert(saved);
    if (!quiet) {
      this.flash(
        'success',
        id === null ? 'Frage erstellt.' : 'Änderungen gespeichert.',
      );
    }
    void this.loadStats();
    return saved;
  }

  async setActive(question: AdminQuestion, active: boolean): Promise<void> {
    try {
      this.upsert(await this.api.setQuestionActive(question.id, active));
      void this.loadStats();
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
      await this.loadQuestions();
    }
  }

  async deleteQuestion(question: AdminQuestion): Promise<boolean> {
    return this.run(async () => {
      await this.api.deleteQuestion(question.id);
      if (this.editing()?.id === question.id) {
        this.editing.set(null);
      }
      this.questions.update((list) =>
        (list ?? []).filter((q) => q.id !== question.id),
      );
      return 'Frage gelöscht.';
    });
  }

  async deleteAll(): Promise<boolean> {
    return this.run(async () => {
      const result = await this.api.deleteAllQuestions();
      this.questions.set([]);
      return `${result.deleted} Fragen gelöscht.`;
    });
  }

  async importSamples(): Promise<boolean> {
    return this.run(async () => {
      const result = await this.api.importSampleQuestions();
      await this.loadQuestions();
      return `${result.imported} Beispielfragen importiert.`;
    });
  }

  setNumber(key: NumericKey, value: number): void {
    this.form.update((form) => (form ? { ...form, [key]: value } : form));
  }

  setSpeedBonus(enabled: boolean): void {
    this.form.update((form) =>
      form ? { ...form, speedBonusEnabled: enabled } : form,
    );
  }

  /** Fills in values (defaults or a preset); they apply once saved. */
  applySettings(values: Partial<AdminSettings>): void {
    this.form.update((form) => (form ? { ...form, ...values } : form));
  }

  applyDefaults(): void {
    const defaults = this.settingsResponse()?.defaults;
    if (defaults) {
      this.form.set({ ...defaults });
    }
  }

  discardSettings(): void {
    const settings = this.settings();
    if (settings) {
      this.form.set({ ...settings });
    }
  }

  async saveSettings(): Promise<void> {
    const form = this.form();
    if (!form || !this.valid()) {
      return;
    }
    this.saving.set(true);
    try {
      const response = await this.api.saveSettings(form);
      this.settingsResponse.set(response);
      this.form.set({ ...response.settings });
      this.flash('success', 'Gespeichert. Gilt ab dem nächsten Duell.');
    } catch {
      this.flash('error', 'Speichern fehlgeschlagen. Bitte prüfe die Werte.');
    } finally {
      this.saving.set(false);
    }
  }

  /** Opens the editor dialog for a question, or a new one. */
  openEditor(
    question: AdminQuestion | null,
    preset: Partial<QuestionDraft> = {},
  ): void {
    this.editorError.set('');
    this.editing.set(
      question
        ? { draft: draftFrom(question), id: question.id }
        : { draft: { ...emptyDraft(), ...preset }, id: null },
    );
  }

  async saveEditing(draft: QuestionDraft): Promise<void> {
    const editing = this.editing();
    if (!editing) {
      return;
    }
    this.saving.set(true);
    try {
      await this.saveQuestion(draft, editing.id);
      this.editing.set(null);
    } catch (error) {
      this.editorError.set(apiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmAction(): Promise<void> {
    const confirm = this.confirm();
    if (!confirm) {
      return;
    }
    const done =
      confirm.kind === 'delete'
        ? await this.deleteQuestion(confirm.question)
        : await this.deleteAll();
    if (done) {
      this.confirm.set(null);
    }
  }

  /** Moves a question to another category (null = none). */
  async moveQuestion(
    question: AdminQuestion,
    category: string | null,
  ): Promise<void> {
    if ((question.category ?? null) === category) {
      return;
    }
    try {
      await this.saveQuestion(
        { ...draftFrom(question), category: category ?? '' },
        question.id,
      );
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
    }
  }

  /** Saves the settings right away, e.g. after a quick toggle. */
  async applyAndSave(values: Partial<AdminSettings>): Promise<void> {
    this.applySettings(values);
    await this.saveSettings();
  }

  limit(key: NumericKey): SettingsLimit {
    return this.settingsResponse()?.limits[key] ?? { min: 0, max: 0 };
  }

  flash(variant: AdminMessage['variant'], text: string): void {
    this.message.set({ variant, text });
    setTimeout(() => {
      if (this.message()?.text === text) {
        this.message.set(null);
      }
    }, 4_000);
  }

  private async run(action: () => Promise<string>): Promise<boolean> {
    this.busy.set(true);
    try {
      this.flash('success', await action());
      void this.loadStats();
      return true;
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private upsert(question: AdminQuestion): void {
    this.questions.update((list) => {
      const current = list ?? [];
      return current.some((q) => q.id === question.id)
        ? current.map((q) => (q.id === question.id ? question : q))
        : [...current, question];
    });
  }
}

export function durationOf(settings: AdminSettings | null): number {
  return settings
    ? COUNTDOWN_SEC +
        settings.questionsPerGame *
          (settings.questionDurationSec + settings.revealDurationSec)
    : 0;
}
