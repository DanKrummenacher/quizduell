// TEMPORARY: proposal B «Messe-Leitstand», rules as presets (development only).
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import type { AdminSettings } from '../../../core/contracts/admin.contract';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import {
  durationOf,
  formatDuration,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
} from '../proposal-store';

type PresetValues = Pick<
  AdminSettings,
  'questionsPerGame' | 'questionDurationSec' | 'revealDurationSec'
>;

@Component({
  selector: 'app-stage-rules',
  templateUrl: './stage-rules.component.html',
  styleUrl: './stage-rules.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StageRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly fields = NUMERIC_FIELDS;
  protected readonly duration = formatDuration;

  /** Three ways to play, the middle one with the recommended values. */
  protected readonly presets = computed(() => {
    const response = this.store.settingsResponse();
    const form = this.store.form();
    if (!response || !form) {
      return [];
    }
    const clamp = (key: NumericKey, value: number) =>
      Math.min(response.limits[key].max, Math.max(response.limits[key].min, value));
    const preset = (values: PresetValues): PresetValues => ({
      questionsPerGame: clamp('questionsPerGame', values.questionsPerGame),
      questionDurationSec: clamp('questionDurationSec', values.questionDurationSec),
      revealDurationSec: clamp('revealDurationSec', values.revealDurationSec),
    });
    const d = response.defaults;
    return [
      {
        title: 'Kurz & knackig',
        icon: 'speed',
        text: 'Für viel Betrieb am Stand',
        values: preset({
          questionsPerGame: 3,
          questionDurationSec: 10,
          revealDurationSec: 3,
        }),
      },
      {
        title: 'Empfohlen',
        icon: 'checkmark-circle',
        text: 'Die bewährten Standardwerte',
        values: preset(d),
      },
      {
        title: 'Ausführlich',
        icon: 'hourglass',
        text: 'Mehr Fragen, mehr Zeit',
        values: preset({
          questionsPerGame: 5,
          questionDurationSec: 30,
          revealDurationSec: 5,
        }),
      },
    ].map((item) => ({
      ...item,
      summary: `${item.values.questionsPerGame} Fragen · ${item.values.questionDurationSec} s pro Frage · max. ${formatDuration(durationOf({ ...form, ...item.values }))}`,
      selected:
        form.questionsPerGame === item.values.questionsPerGame &&
        form.questionDurationSec === item.values.questionDurationSec &&
        form.revealDurationSec === item.values.revealDurationSec,
    }));
  });

  protected readonly hasPreset = computed(() =>
    this.presets().some((p) => p.selected),
  );

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }

  protected setBonus(event: Event): void {
    this.store.setSpeedBonus(eventChecked(event));
  }
}
