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

/**
 * TEMPORARY: combinations of M2.1 (ring with rolling number) and M8.2
 * (connected players with light).
 */
@Component({
  selector: 'app-match-blend',
  imports: [NgTemplateOutlet],
  templateUrl: './match-blend.component.html',
  styleUrl: './match-blend.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchBlendComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  /** 60 ticks for the big rings, 40 for the two smaller ones. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);
  protected readonly smallTicks = Array.from(
    { length: 40 },
    (_, index) => index * 9,
  );

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Share of the countdown that is left, from 1 down to 0. */
  protected readonly left = computed(
    () => this.remainingMs() / Math.max(1, this.durationMs()),
  );
  protected readonly filled = computed(() => Math.round(this.left() * 60));
  protected readonly smallFilled = computed(() => Math.round(this.left() * 40));

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
