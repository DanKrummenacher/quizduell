import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import {
  MATCH_BLEND,
  MATCH_CLEAN,
  MATCH_DUEL,
  MATCH_EVOLVED,
  MATCH_MORE,
  MATCH_POLISH,
  type MatchLayout,
} from '../lobby-design';
import { MatchBlendComponent } from './match-blend.component';
import { MatchCleanComponent } from './match-clean.component';
import { MatchPolishComponent } from './match-polish.component';
import { MatchDuelComponent } from './match-duel.component';
import { MatchEvolvedComponent } from './match-evolved.component';
import { MatchMoreComponent } from './match-more.component';
import { MatchIdeasComponent } from './match-ideas.component';

@Component({
  selector: 'app-facelift-match-found',
  imports: [
    MatchIdeasComponent,
    MatchMoreComponent,
    MatchEvolvedComponent,
    MatchBlendComponent,
    MatchDuelComponent,
    MatchCleanComponent,
    MatchPolishComponent,
  ],
  host: { '[class.is-proposal]': "layout() !== 'facelift'" },
  templateUrl: './facelift-match-found.component.html',
  styleUrl: './facelift-match-found.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftMatchFoundComponent implements OnInit {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<MatchLayout>('facelift');
  readonly playerName = input('');
  protected readonly isPolish = computed(() => MATCH_POLISH.includes(this.layout()));
  protected readonly isClean = computed(() => MATCH_CLEAN.includes(this.layout()));
  protected readonly isDuel = computed(() => MATCH_DUEL.includes(this.layout()));
  protected readonly isBlend = computed(() => MATCH_BLEND.includes(this.layout()));
  protected readonly isEvolved = computed(() =>
    MATCH_EVOLVED.includes(this.layout()),
  );
  protected readonly isMore = computed(() => MATCH_MORE.includes(this.layout()));
  readonly opponentName = input.required<string>();
  readonly durationMs = input<number>(3000);

  /** Seconds until the first question, counted down locally. */
  protected readonly countdown = signal(3);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.countdown.set(Math.max(1, Math.ceil(this.durationMs() / 1000)));
    const timer = setInterval(
      () => this.countdown.update((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}
