// TEMPORARY: proposal C «Fragen-Studio», the rules around one duel (development only).
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import {
  BASE_POINTS,
  formatDuration,
  MAX_SPEED_BONUS,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
} from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';

@Component({
  selector: 'app-studio-rules',
  imports: [DuelTimelineComponent],
  templateUrl: './studio-rules.component.html',
  styleUrl: './studio-rules.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StudioRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly duel = NUMERIC_FIELDS.slice(0, 3);
  protected readonly around = NUMERIC_FIELDS.slice(3);
  protected readonly base = BASE_POINTS;
  protected readonly bonus = MAX_SPEED_BONUS;

  protected readonly total = computed(() =>
    formatDuration(this.store.gameSeconds()),
  );

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }

  protected setBonus(event: Event): void {
    this.store.setSpeedBonus(eventChecked(event));
  }
}
