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

const TICK_MS = 100;
/** In the preview the countdown starts again, so it can be looked at. */
const RESTART_MS = 1500;
/** «Haken, dann Zahl»: how long the check shows before the countdown. */
const CHECK_MS = 800;

/**
 * TEMPORARY: combinations of the favourite match proposals: players that
 * meet (M8), the ring of the search (M2) and the big number (M4).
 */
@Component({
  selector: 'app-match-final',
  imports: [NgTemplateOutlet],
  templateUrl: './match-final.component.html',
  styleUrl: './match-final.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchFinalComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  protected readonly filledTicks = computed(() =>
    Math.round((this.remainingMs() / Math.max(1, this.durationMs())) * 60),
  );
  protected readonly showCheck = computed(
    () => this.durationMs() - this.remainingMs() < CHECK_MS,
  );

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
