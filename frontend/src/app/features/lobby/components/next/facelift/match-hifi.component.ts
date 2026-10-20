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

/**
 * TEMPORARY: high-fidelity proposals for «Gegner gefunden». A clear
 * hierarchy (who is my opponent?), calm cards and one motion each.
 */
@Component({
  selector: 'app-match-hifi',
  templateUrl: './match-hifi.component.html',
  styleUrl: './match-hifi.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchHifiComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Share of the countdown that is left, from 1 down to 0. */
  protected readonly left = computed(
    () => this.remainingMs() / Math.max(1, this.durationMs()),
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
