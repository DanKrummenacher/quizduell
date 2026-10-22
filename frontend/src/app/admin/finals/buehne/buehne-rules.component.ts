// Bühne: the rules as presets and large sliders.
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import type { AdminSettings } from '../../../core/contracts/admin.contract';
import { ProposalPro } from '../../proposals/pro';
import {
  durationOf,
  formatDuration,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
} from '../../proposals/proposal-store';
import { BuehneState } from './buehne-state';

type Values = Pick<
  AdminSettings,
  'questionsPerGame' | 'questionDurationSec' | 'revealDurationSec'
>;

@Component({
  selector: 'app-buehne-rules',
  templateUrl: './buehne-rules.component.html',
  styleUrl: './buehne-rules.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuehneRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  private readonly state = inject(BuehneState);

  protected readonly duel = NUMERIC_FIELDS.slice(0, 3);
  protected readonly stand = NUMERIC_FIELDS.slice(3);
  protected readonly duration = computed(() =>
    this.store.valid() ? formatDuration(this.store.gameSeconds()) : '–',
  );

  /** Three ways to play; the middle one has the recommended values. */
  protected readonly presets = computed(() => {
    const response = this.store.settingsResponse();
    const form = this.store.form();
    if (!response || !form) {
      return [];
    }
    const clamp = (key: NumericKey, v: number) =>
      Math.min(response.limits[key].max, Math.max(response.limits[key].min, v));
    const make = (title: string, text: string, icon: string, v: Values) => {
      const values: Values = {
        questionsPerGame: clamp('questionsPerGame', v.questionsPerGame),
        questionDurationSec: clamp('questionDurationSec', v.questionDurationSec),
        revealDurationSec: clamp('revealDurationSec', v.revealDurationSec),
      };
      const total = durationOf({ ...form, ...values });
      return {
        title,
        text,
        icon,
        values,
        total: formatDuration(total),
        segments: [
          { kind: 'start', s: 3 },
          ...Array.from({ length: values.questionsPerGame }, () => [
            { kind: 'q', s: values.questionDurationSec },
            { kind: 'r', s: values.revealDurationSec },
          ]).flat(),
        ],
        selected: (Object.keys(values) as (keyof Values)[]).every(
          (k) => form[k] === values[k],
        ),
      };
    };
    const d = response.defaults;
    return [
      make('Schnell', 'Viel Betrieb, kurze Duelle', 'speed', {
        questionsPerGame: 3,
        questionDurationSec: 10,
        revealDurationSec: 3,
      }),
      make('Empfohlen', 'Die bewährte Mitte', 'checkmark-circle', d),
      make('Ausführlich', 'Mehr Fragen, mehr Zeit', 'hourglass', {
        questionsPerGame: 5,
        questionDurationSec: 30,
        revealDurationSec: 5,
      }),
    ];
  });
  protected readonly custom = computed(
    () => this.presets().length > 0 && !this.presets().some((p) => p.selected),
  );

  protected percent(key: NumericKey): number {
    const limit = this.store.limit(key);
    const value = this.store.form()?.[key] ?? 0;
    return ((value - limit.min) / Math.max(1, limit.max - limit.min)) * 100;
  }

  protected slide(key: NumericKey, event: Event): void {
    this.store.setNumber(key, Number((event.target as HTMLInputElement).value));
  }

  protected changed(key: NumericKey): boolean {
    return this.store.form()?.[key] !== this.store.settings()?.[key];
  }

  protected async save(): Promise<void> {
    await this.store.saveSettings();
    if (!this.store.dirty()) {
      this.store.message.set(null);
      this.state.say('Spielregeln gespeichert');
    }
  }
}
