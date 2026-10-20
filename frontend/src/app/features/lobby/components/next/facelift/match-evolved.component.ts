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
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/icon';
import type { MatchLayout } from '../lobby-design';

const TICK_MS = 50;
/** In the preview the countdown starts again, so it can be looked at. */
const RESTART_MS = 1800;
/** «Ring öffnet sich»: how long the full ring shows before the players. */
const RING_PHASE_MS = 900;

/**
 * TEMPORARY: proposals that build directly on the favourites M2 (ring)
 * and M8 (connected players). Each one improves a single thing.
 */
@Component({
  selector: 'app-match-evolved',
  imports: [NgTemplateOutlet],
  templateUrl: './match-evolved.component.html',
  styleUrl: './match-evolved.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchEvolvedComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);
  protected readonly dots = [3, 2, 1];

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  private readonly elapsedMs = computed(
    () => this.durationMs() - this.remainingMs(),
  );
  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  protected readonly filledTicks = computed(() =>
    Math.round((this.remainingMs() / Math.max(1, this.durationMs())) * 60),
  );

  /** «Ring öffnet sich»: the full ring first, then the players. */
  protected readonly ringPhase = computed(() => this.elapsedMs() < RING_PHASE_MS);

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
