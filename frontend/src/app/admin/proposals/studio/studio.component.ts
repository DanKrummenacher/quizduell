// TEMPORARY: proposal C «Fragen-Studio» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/notification';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalStore } from '../proposal-store';
import { StudioQuestionsComponent } from './studio-questions.component';
import { StudioRulesComponent } from './studio-rules.component';

/**
 * The questions are the heart: a list, the editor on the page and a live
 * preview of the question as the players see it, side by side. The live
 * state sits as a strip under the header.
 */
@Component({
  selector: 'app-studio',
  imports: [LogoMarkComponent, StudioQuestionsComponent, StudioRulesComponent],
  templateUrl: './studio.component.html',
  styleUrl: './studio.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StudioComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly view = signal<'questions' | 'rules'>('questions');
  protected readonly strip = computed(() => {
    const s = this.store.stats();
    if (!s) {
      return [];
    }
    const rate = this.store.overallRate();
    return [
      { label: 'Geräte', value: s.playersOnline, live: true },
      { label: 'Duelle jetzt', value: s.activeGames, live: true },
      { label: 'Suchen', value: s.playersSearching, live: true },
      { label: 'Duelle heute', value: s.gamesToday, live: false },
      { label: 'Duelle total', value: s.gamesTotal, live: false },
      { label: 'Richtig', value: rate === null ? '–' : `${rate} %`, live: false },
    ];
  });
}
