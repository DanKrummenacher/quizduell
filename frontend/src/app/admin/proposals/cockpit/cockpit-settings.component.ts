// TEMPORARY: proposal A «Cockpit», rules with a live picture (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import {
  formatDuration,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
} from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';

const field = (key: NumericKey) => NUMERIC_FIELDS.find((f) => f.key === key)!;

@Component({
  selector: 'app-cockpit-settings',
  imports: [DuelTimelineComponent],
  templateUrl: './cockpit-settings.component.html',
  styleUrl: './cockpit-settings.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CockpitSettingsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly duration = formatDuration;

  protected readonly groups = [
    {
      title: 'Duell',
      text: 'Wie viele Fragen und wie viel Zeit.',
      icon: 'lightning-strike',
      fields: [
        field('questionsPerGame'),
        field('questionDurationSec'),
        field('revealDurationSec'),
      ],
    },
    {
      title: 'Nach dem Duell',
      text: 'Zeit, um eine Revanche zu fordern.',
      icon: 'reload',
      fields: [field('rematchTimeoutSec')],
    },
    {
      title: 'Stand-Geräte',
      text: 'Zurück zur Startseite, wenn niemand spielt.',
      icon: 'ipad',
      fields: [field('idleResetSec')],
    },
  ];

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }

  protected setBonus(event: Event): void {
    this.store.setSpeedBonus(eventChecked(event));
  }
}
