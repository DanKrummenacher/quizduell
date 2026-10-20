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
import type { MatchLayout } from '../lobby-design';

const TICK_MS = 50;
/** In the preview the countdown starts again, so it can be looked at. */
const RESTART_MS = 1500;
/** R1: the ring first fills up (end of the search), then runs down. */
const SWEEP_MS = 400;
/** R3: how long the completed ring shows before the players meet. */
const RING_PHASE_MS = 900;

/**
 * TEMPORARY: refined proposals based on the favourites «Ring» (M2) and
 * «Verbunden» (M8). They keep the structure of the search screen (visual,
 * title, text, then the countdown where the button was), so nothing jumps.
 */
@Component({
  selector: 'app-match-refined',
  templateUrl: './match-refined.component.html',
  styleUrl: './match-refined.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchRefinedComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);
  protected readonly segments = [0, 1, 2];

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  private readonly elapsedMs = computed(
    () => this.durationMs() - this.remainingMs(),
  );
  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));

  /** Ticks of the ring: fill up quickly, then run down to the start. */
  protected readonly filledTicks = computed(() => {
    const elapsed = this.elapsedMs();
    if (elapsed < SWEEP_MS) {
      return Math.round((elapsed / SWEEP_MS) * 60);
    }
    const rest = Math.max(1, this.durationMs() - SWEEP_MS);
    return Math.round((this.remainingMs() / rest) * 60);
  });

  /** R3: first the completed ring, then the players. */
  protected readonly ringPhase = computed(() => this.elapsedMs() < RING_PHASE_MS);
  protected readonly sequenceTicks = computed(() =>
    Math.min(60, Math.round((this.elapsedMs() / (RING_PHASE_MS * 0.6)) * 60)),
  );

  /** R4: one segment per second, filling up. */
  protected segmentFill(index: number): number {
    const fill = (this.elapsedMs() - index * 1000) / 1000;
    return Math.min(1, Math.max(0, fill));
  }

  protected readonly myInitial = computed(() => this.initialOf(this.playerName()));
  protected readonly opponentInitial = computed(() =>
    this.initialOf(this.opponentName()),
  );

  ngOnInit(): void {
    let pause = 0;
    this.remainingMs.set(this.durationMs());
    const timer = setInterval(() => {
      if (this.remainingMs() > 0) {
        this.remainingMs.update((ms) => Math.max(0, ms - TICK_MS));
        return;
      }
      pause += TICK_MS;
      if (pause >= RESTART_MS) {
        pause = 0;
        this.round.update((value) => value + 1);
        this.remainingMs.set(this.durationMs());
      }
    }, TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }
}
