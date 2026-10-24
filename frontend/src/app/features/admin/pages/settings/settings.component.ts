import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AdminSettings,
  NumericSettingKey,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  formatDuration,
  formatInt,
  formatRelative,
  formatSeconds,
} from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import {
  duelLength,
  formatSetting,
  SETTINGS_META,
  type SettingMeta,
} from '../../core/settings-meta';
import { AdStateComponent } from '../../ui/state.component';
import { AdToggleComponent } from '../../ui/toggle.component';
import { messageOf } from '../questions/questions.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';

/** Pages that can hold unsaved changes when the admin navigates away. */
export interface UnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** The rules of the game, with what they mean before they are saved. */
@Component({
  selector: 'app-admin-settings',
  imports: [AdPageHeadComponent, RouterLink, AdStateComponent, AdToggleComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent implements UnsavedChanges {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  protected readonly meta = SETTINGS_META;
  protected readonly formatSetting = formatSetting;
  protected readonly formatRelative = formatRelative;

  protected readonly draft = signal<AdminSettings | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Take over the saved rules when they arrive, unless the admin is editing.
    effect(() => {
      const view = this.data.settings.value();
      if (view && untracked(() => !this.dirty())) {
        this.draft.set({ ...view.settings });
      }
    });
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
  protected readonly rows = computed(() => {
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

  /** What the rules mean for players, with the measured answer time. */
  protected readonly impact = computed(() => {
    const draft = this.draft();
    if (!draft) {
      return null;
    }
    const questions = this.data.questions.value() ?? [];
    const active = questions.filter((q) => q.active).length;
    const answered = questions.reduce((sum, q) => sum + q.stats.answers, 0);
    const answerMs = questions.reduce(
      (sum, q) => sum + (q.stats.avgAnswerMs ?? 0) * q.stats.answers,
      0,
    );
    const avgAnswerMs = answered > 0 ? answerMs / answered : null;
    const length = duelLength(draft, avgAnswerMs ?? undefined);
    const maxPoints = draft.questionsPerGame * (draft.speedBonusEnabled ? 200 : 100);
    const warnings: string[] = [];
    if (active < draft.questionsPerGame) {
      warnings.push(
        `Nur ${formatInt(active)} aktive Fragen – mit ${draft.questionsPerGame} Fragen pro Duell kann niemand spielen.`,
      );
    }
    if (
      avgAnswerMs !== null &&
      draft.questionDurationSec * 1000 < avgAnswerMs * 1.4
    ) {
      warnings.push(
        `Im Schnitt brauchen Spielende ${formatSeconds(avgAnswerMs)} pro Antwort. Mit ${draft.questionDurationSec} s läuft die Zeit oft ab.`,
      );
    }
    return {
      typical: formatDuration(length.typical),
      max: formatDuration(length.max),
      maxPoints: formatInt(maxPoints),
      active: formatInt(active),
      duelsWithoutRepeat: draft.questionsPerGame
        ? Math.max(0, Math.floor(active / draft.questionsPerGame))
        : 0,
      avgAnswer: avgAnswerMs === null ? null : formatSeconds(avgAnswerMs),
      warnings,
    };
  });

  protected setNumber(meta: SettingMeta, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.update(
      meta.key as NumericSettingKey,
      Number.isFinite(value) ? Math.round(value) : 0,
    );
  }

  protected step(meta: SettingMeta, direction: 1 | -1): void {
    const key = meta.key as NumericSettingKey;
    const draft = this.draft();
    const limits = this.limits();
    if (!draft || !limits) {
      return;
    }
    const step = meta.step ?? 1;
    const next = Math.round((draft[key] + direction * step) / step) * step;
    this.update(key, Math.min(limits[key].max, Math.max(limits[key].min, next)));
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

  private update(key: NumericSettingKey, value: number): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: value } : draft));
    this.error.set(null);
  }

  protected discard(): void {
    const saved = this.saved();
    if (saved) {
      this.draft.set({ ...saved });
    }
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving() || this.invalid().size > 0) {
      return;
    }
    const active = (this.data.questions.value() ?? []).filter(
      (q) => q.active,
    ).length;
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
      this.notify.success('Spielregeln gespeichert – gelten ab dem nächsten Duell');
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }
}
