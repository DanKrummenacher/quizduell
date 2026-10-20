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
import { MATCH_FINAL, MATCH_MORE, type MatchLayout } from '../lobby-design';
import { MatchFinalComponent } from './match-final.component';
import { MatchMoreComponent } from './match-more.component';
import { MatchIdeasComponent } from './match-ideas.component';

@Component({
  selector: 'app-facelift-match-found',
  imports: [MatchIdeasComponent, MatchMoreComponent, MatchFinalComponent],
  host: { '[class.is-proposal]': "layout() !== 'facelift'" },
  templateUrl: './facelift-match-found.component.html',
  styleUrl: './facelift-match-found.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftMatchFoundComponent implements OnInit {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<MatchLayout>('facelift');
  readonly playerName = input('');
  protected readonly isFinal = computed(() => MATCH_FINAL.includes(this.layout()));
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
