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

/** TEMPORARY: proposals for the «Gegner gefunden» screen. */
@Component({
  selector: 'app-match-ideas',
  imports: [NgTemplateOutlet],
  templateUrl: './match-ideas.component.html',
  styleUrl: './match-ideas.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchIdeasComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  /** One tick per 6 degrees, as on the search screen. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);

  private readonly remainingMs = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  /** Whole seconds left (3, 2, 1, then 0 = «Los»). */
  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Share of the countdown that is left, from 1 down to 0. */
  protected readonly left = computed(() =>
    Math.max(0, this.remainingMs() / Math.max(1, this.durationMs())),
  );
  protected readonly filledTicks = computed(() => Math.round(this.left() * 60));

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
        this.remainingMs.set(this.durationMs());
      }
    }, TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }
}
