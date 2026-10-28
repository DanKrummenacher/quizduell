import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AdminSettings,
  AuditEntry,
  NumericSettingKey,
} from '../../../../core/contracts/admin.contract';
import { AdminApi, messageOf } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import { formatInt, formatRelative } from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import {
  formatSetting,
  SETTINGS_META,
  type SettingMeta,
} from '../../core/settings-meta';
import { AdStateComponent } from '../../ui/state.component';
import { AdToggleComponent } from '../../ui/toggle.component';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import {
  effectsOf,
  impactOf,
  lastChangeOf,
  optionNoteOf,
  presetsOf,
} from './settings-figures';

/** Pages that can hold unsaved changes when the admin navigates away. */
export interface UnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** A rule with its value, limits and standard, as the rows show it. */
interface Row {
  meta: SettingMeta;
  value: number | boolean;
  number: number;
  limit: { min: number; max: number } | null;
  changed: boolean;
  invalid: boolean;
  defaultText: string | null;
  rangeText: string;
}

/** The values offered in a rule's menu; any other is typed in. */
const QUICK_VALUES: Partial<Record<keyof AdminSettings, number[]>> = {
  questionsPerGame: [5, 7, 10, 15],
  questionDurationSec: [10, 15, 20, 30],
  revealDurationSec: [3, 4, 6, 8],
  rematchTimeoutSec: [30, 45, 60, 90],
  idleResetSec: [0, 60, 120, 300],
};

/** How long «Verwerfen» can be taken back, and «Gespeichert» stays. */
const UNDO_MS = 6000;
const SAVED_MS = 2600;

/**
 * The rules of the game in two steps: a preset for the flow of a duel, then
 * every rule on its own. Changes wait in a bar and are reviewed before saving.
 */
@Component({
  selector: 'app-admin-settings',
  imports: [
    AdPageHeadComponent,
    AdStateComponent,
    AdToggleComponent,
    AutofocusDirective,
    NgTemplateOutlet,
    RouterLink,
  ],
  templateUrl: './settings.component.html',
  styleUrls: [
    './settings.component.scss',
    './settings-rules.scss',
    './settings-bar.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent implements UnsavedChanges {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  protected readonly formatSetting = formatSetting;

  protected readonly draft = signal<AdminSettings | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  /** The chapters open; the first one at the start. */
  protected readonly openChapters = signal<ReadonlySet<number>>(new Set([0]));
  /** The rule whose value menu is open, and the option under the keys. */
  protected readonly menuKey = signal<string | null>(null);
  protected readonly menuActive = signal(0);
  /** The review above the bar, and the short notes after saving or discarding. */
  protected readonly reviewOpen = signal(false);
  protected readonly justSaved = signal(false);
  protected readonly discarded = signal<AdminSettings | null>(null);

  /** When the first unsaved change was made; the clock refreshes the text. */
  private readonly dirtySince = signal<number | null>(null);
  private readonly now = signal(Date.now());
  /** The last saves of the rules, from the log. */
  private readonly history = signal<AuditEntry[] | null>(null);
  private discardTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Take over the saved rules when they arrive, unless the admin is editing.
    effect(() => {
      const view = this.data.settings.value();
      if (view && untracked(() => !this.dirty())) {
        this.draft.set({ ...view.settings });
      }
    });
    effect(() => {
      const dirty = this.dirty();
      untracked(() => {
        if (!dirty) {
          this.dirtySince.set(null);
          this.reviewOpen.set(false);
        } else if (this.dirtySince() === null) {
          this.dirtySince.set(Date.now());
        }
      });
    });
    const clock = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(clock);
      clearTimeout(this.discardTimer);
    });
    void this.loadHistory();
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.menuKey.set(null);
      this.reviewOpen.set(false);
    } else if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === 's' &&
      this.dirty()
    ) {
      event.preventDefault();
      void this.save();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  protected onPointer(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.menuKey() && !target?.closest('[data-menu]')) {
      this.menuKey.set(null);
    }
  }

  protected readonly saved = computed(
    () => this.data.settings.value()?.settings ?? null,
  );
  protected readonly limits = computed(
    () => this.data.settings.value()?.limits ?? null,
  );
  protected readonly defaults = computed(
    () => this.data.settings.value()?.defaults ?? null,
  );

  protected readonly changes = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return [];
    }
    return SETTINGS_META.filter((meta) => draft[meta.key] !== saved[meta.key]).map(
      (meta) => ({
        key: meta.key,
        meta,
        label: meta.label,
        before: formatSetting(meta.key, saved[meta.key]),
        after: formatSetting(meta.key, draft[meta.key]),
      }),
    );
  });

  protected readonly dirty = computed(() => this.changes().length > 0);

  protected readonly invalid = computed(() => {
    const draft = this.draft();
    const limits = this.limits();
    if (!draft || !limits) {
      return new Set<NumericSettingKey>();
    }
    return new Set(
      (Object.keys(limits) as NumericSettingKey[]).filter((key) => {
        const value = draft[key];
        return (
          !Number.isInteger(value) ||
          value < limits[key].min ||
          value > limits[key].max
        );
      }),
    );
  });

  /** One row per rule with everything the template shows. */
  protected readonly rows = computed((): Row[] => {
    const draft = this.draft();
    const saved = this.saved();
    const limits = this.limits();
    const defaults = this.defaults();
    if (!draft || !limits) {
      return [];
    }
    const invalid = this.invalid();
    return SETTINGS_META.map((meta) => {
      const value = draft[meta.key];
      const limit = meta.key === 'speedBonusEnabled' ? null : limits[meta.key];
      return {
        meta,
        value,
        number: typeof value === 'number' ? value : 0,
        limit,
        changed: saved !== null && value !== saved[meta.key],
        invalid: meta.key !== 'speedBonusEnabled' && invalid.has(meta.key),
        defaultText:
          defaults && value !== defaults[meta.key]
            ? formatSetting(meta.key, defaults[meta.key])
            : null,
        rangeText: limit
          ? `${limit.min}–${limit.max}${meta.unit ? ` ${meta.unit}` : ''}${meta.zero ? `, 0 = ${meta.zero}` : ''}`
          : '',
      };
    });
  });

  /** The rules in the order of a duel: how it runs, the points, what follows. */
  protected readonly chapters = computed(() => {
    const rows = this.rows();
    const pick = (keys: (keyof AdminSettings)[]) =>
      rows.filter((r) => keys.includes(r.meta.key));
    return [
      {
        title: 'Ablauf eines Duells',
        rows: pick(['questionsPerGame', 'questionDurationSec', 'revealDurationSec']),
      },
      { title: 'Punkte', rows: pick(['speedBonusEnabled']) },
      { title: 'Nach dem Duell', rows: pick(['rematchTimeoutSec', 'idleResetSec']) },
    ];
  });

  protected readonly allOpen = computed(
    () => this.openChapters().size === this.chapters().length,
  );

  private readonly avgAnswerMs = computed(() => {
    const questions = this.data.questions.value() ?? [];
    const answered = questions.reduce((sum, q) => sum + q.stats.answers, 0);
    const answerMs = questions.reduce(
      (sum, q) => sum + (q.stats.avgAnswerMs ?? 0) * q.stats.answers,
      0,
    );
    return answered > 0 ? answerMs / answered : null;
  });

  private readonly activeQuestions = computed(
    () => (this.data.questions.value() ?? []).filter((q) => q.active).length,
  );

  /** What the rules mean for players, with the measured answer time. */
  protected readonly impact = computed(() => {
    const draft = this.draft();
    return draft
      ? impactOf(draft, this.activeQuestions(), this.avgAnswerMs())
      : null;
  });

  /** The same three figures saved and now, with the difference in words. */
  protected readonly effects = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    return draft && saved
      ? effectsOf(draft, saved, this.activeQuestions(), this.avgAnswerMs())
      : [];
  });

  /** Three presets for the flow of a duel; «Eigene» is any other mix. */
  protected readonly presets = computed(() => {
    const defaults = this.defaults();
    const draft = this.draft();
    return defaults && draft ? presetsOf(defaults, draft, this.avgAnswerMs()) : [];
  });

  protected readonly activePreset = computed(() => {
    const draft = this.draft();
    return (
      this.presets().find(
        (preset) =>
          draft &&
          Object.entries(preset.values).every(
            ([key, value]) => draft[key as keyof AdminSettings] === value,
          ),
      )?.id ?? null
    );
  });

  protected readonly atDefault = computed(() => {
    const draft = this.draft();
    const defaults = this.defaults();
    return (
      !!draft &&
      !!defaults &&
      SETTINGS_META.every((meta) => draft[meta.key] === defaults[meta.key])
    );
  });

  /** The last save of the rules as a short figure and a line below it. */
  protected readonly lastChange = computed(() =>
    lastChangeOf(
      this.history()?.[0],
      this.data.settings.value()?.updatedAt ?? null,
      this.now(),
    ),
  );

  protected readonly sinceText = computed(() => {
    const since = this.dirtySince();
    return since === null ? '' : formatRelative(since, this.now());
  });

  private async loadHistory(): Promise<void> {
    try {
      const page = await this.api.audit(undefined, 50, false);
      this.history.set(page.entries.filter((e) => e.action.startsWith('settings.')));
    } catch {
      this.history.set([]);
    }
  }

  protected summaryOf(rows: Row[]): string {
    return rows
      .map((r) =>
        r.meta.key === 'questionsPerGame'
          ? `${r.value} Fragen`
          : r.meta.key === 'speedBonusEnabled'
            ? `Tempo-Bonus ${r.value ? 'an' : 'aus'}`
            : `${r.meta.label} ${formatSetting(r.meta.key, r.value)}`,
      )
      .join(' · ');
  }

  protected changedIn(rows: Row[]): number {
    return rows.filter((r) => r.changed).length;
  }

  /** The standard of a rule for its column, «An» rather than «an». */
  protected standardText(row: Row): string {
    const text = row.defaultText ?? formatSetting(row.meta.key, row.value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  protected defaultOf(meta: SettingMeta): number | boolean | null {
    return this.defaults()?.[meta.key] ?? null;
  }

  protected quickFor(meta: SettingMeta): number[] {
    return QUICK_VALUES[meta.key] ?? [];
  }

  /** What a value would mean, beside it in the menu. */
  protected optionNote(meta: SettingMeta, value: number): string {
    const draft = this.draft();
    return draft ? optionNoteOf(meta, value, draft, this.avgAnswerMs()) : '';
  }

  protected toggleChapter(index: number): void {
    this.openChapters.update((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  protected toggleAll(): void {
    this.openChapters.set(
      this.allOpen() ? new Set() : new Set(this.chapters().map((_, i) => i)),
    );
  }

  protected toggleMenu(meta: SettingMeta): void {
    if (this.menuKey() === meta.key) {
      this.menuKey.set(null);
      return;
    }
    const current = this.draft()?.[meta.key];
    this.menuActive.set(Math.max(0, this.quickFor(meta).indexOf(current as number)));
    this.menuKey.set(meta.key);
  }

  protected closeMenu(row: Row): void {
    if (!row.invalid) {
      this.menuKey.set(null);
    }
  }

  protected pick(meta: SettingMeta, value: number): void {
    this.update(meta.key as NumericSettingKey, value);
    this.menuKey.set(null);
  }

  /** Arrow keys move through the values, Enter takes one. */
  protected onMenuKey(event: KeyboardEvent, row: Row): void {
    const values = this.quickFor(row.meta);
    if (!values.length || (event.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.menuActive.set(
        (this.menuActive() + step + values.length) % values.length,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.pick(row.meta, values[this.menuActive()]!);
    }
  }

  protected applyPreset(values: Partial<AdminSettings>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...values } : draft));
  }

  protected setNumber(meta: SettingMeta, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.update(
      meta.key as NumericSettingKey,
      Number.isFinite(value) ? Math.round(value) : 0,
    );
  }

  protected setBonus(value: boolean): void {
    this.draft.update((draft) =>
      draft ? { ...draft, speedBonusEnabled: value } : draft,
    );
  }

  protected toDefault(meta: SettingMeta): void {
    const defaults = this.defaults();
    if (defaults) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: defaults[meta.key] } : draft,
      );
    }
  }

  /** One change back to its saved value. */
  protected undo(meta: SettingMeta): void {
    const saved = this.saved();
    if (saved) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: saved[meta.key] } : draft,
      );
    }
  }

  protected async resetAll(): Promise<void> {
    const sure = await this.confirm.ask({
      title: 'Alle Regeln auf Standard?',
      text: 'Alle Werte gehen auf ihren Standard zurück. Gespeichert wird erst mit «Prüfen und speichern».',
      confirm: 'Auf Standard setzen',
    });
    const defaults = this.defaults();
    if (sure && defaults) {
      this.draft.set({ ...defaults });
    }
  }

  private update(key: NumericSettingKey, value: number): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: value } : draft));
    this.error.set(null);
  }

  /** Back to the saved rules; the bar offers them again for a moment. */
  protected discardSoft(): void {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return;
    }
    this.draft.set({ ...saved });
    this.discarded.set({ ...draft });
    clearTimeout(this.discardTimer);
    this.discardTimer = setTimeout(() => this.discarded.set(null), UNDO_MS);
  }

  protected restoreDiscarded(): void {
    const draft = this.discarded();
    if (draft) {
      this.draft.set(draft);
    }
    this.discarded.set(null);
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving() || this.invalid().size > 0) {
      return;
    }
    const active = this.activeQuestions();
    if (active < draft.questionsPerGame && this.data.questions.value()) {
      const sure = await this.confirm.ask({
        title: 'Trotzdem speichern?',
        text: `Es gibt nur ${formatInt(active)} aktive Fragen. Mit ${draft.questionsPerGame} Fragen pro Duell kann niemand mehr spielen, bis es genug Fragen gibt.`,
        confirm: 'Speichern',
        danger: true,
      });
      if (!sure) {
        return;
      }
    }
    this.saving.set(true);
    try {
      const view = await this.api.updateSettings(draft);
      this.data.settings.set(view);
      this.draft.set({ ...view.settings });
      void this.data.hints.reload();
      void this.loadHistory();
      this.discarded.set(null);
      this.justSaved.set(true);
      setTimeout(() => this.justSaved.set(false), SAVED_MS);
      this.notify.success('Spielregeln gespeichert – gelten ab dem nächsten Duell');
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }
}
