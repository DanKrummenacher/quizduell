// TEMPORARY: proposal A «Cockpit», overview (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/spinner';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { formatDuration, ProposalStore, successRate } from '../proposal-store';
import type { CockpitView } from './cockpit.component';

@Component({
  selector: 'app-cockpit-overview',
  templateUrl: './cockpit-overview.component.html',
  styleUrl: './cockpit-overview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CockpitOverviewComponent {
  protected readonly store = inject(ProposalStore);
  readonly navigate = output<CockpitView>();

  protected readonly rate = successRate;
  protected readonly rules = computed(() => {
    const s = this.store.settings();
    if (!s) {
      return [];
    }
    return [
      `${s.questionsPerGame} Fragen`,
      `${s.questionDurationSec} s pro Frage`,
      s.speedBonusEnabled ? 'Tempo-Bonus an' : 'Tempo-Bonus aus',
      `max. ${formatDuration(this.store.gameSeconds())}`,
    ];
  });
  protected readonly kpis = computed(() => {
    const s = this.store.stats();
    if (!s) {
      return [];
    }
    const rate = this.store.overallRate();
    return [
      { label: 'Duelle heute', value: String(s.gamesToday), icon: 'appointment' },
      { label: 'Duelle insgesamt', value: String(s.gamesTotal), icon: 'trophy' },
      {
        label: 'Richtig beantwortet',
        value: rate === null ? '–' : `${rate} %`,
        icon: 'checkmark-circle',
      },
      {
        label: 'Antworten gegeben',
        value: String(this.store.answersTotal()),
        icon: 'items-list',
      },
    ];
  });

  /** Opens the questions with the given filter. */
  protected showQuestions(filter: {
    category?: string;
    status?: 'inactive';
    search?: string;
  }): void {
    this.store.search.set(filter.search ?? '');
    this.store.status.set(filter.status ?? 'all');
    this.store.category.set(filter.category ?? null);
    this.navigate.emit('questions');
  }

  protected showQuestion(question: AdminQuestion): void {
    this.showQuestions({ search: question.text });
  }
}
