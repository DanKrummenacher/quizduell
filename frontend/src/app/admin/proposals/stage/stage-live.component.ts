// TEMPORARY: proposal B «Messe-Leitstand», the live view (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/spinner';
import { formatDuration, ProposalStore } from '../proposal-store';
import type { StageView } from './stage.component';

@Component({
  selector: 'app-stage-live',
  templateUrl: './stage-live.component.html',
  styleUrl: './stage-live.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StageLiveComponent {
  protected readonly store = inject(ProposalStore);
  readonly navigate = output<StageView>();
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly rules = computed(() => {
    const s = this.store.settings();
    return s
      ? `${s.questionsPerGame} Fragen · ${s.questionDurationSec} s · max. ${formatDuration(this.store.gameSeconds())}`
      : '';
  });
}
