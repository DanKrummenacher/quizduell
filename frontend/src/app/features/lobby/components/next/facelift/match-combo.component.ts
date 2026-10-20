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
const RESTART_MS = 1500;

interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Ticks on a circle (radius 85 in a 200 box), as on the search screen. */
const CIRCLE_TICKS: Tick[] = Array.from({ length: 60 }, (_, index) => {
  const angle = (index * 6 - 90) * (Math.PI / 180);
  return tick(
    100 + 85 * Math.cos(angle),
    100 + 85 * Math.sin(angle),
    Math.cos(angle),
    Math.sin(angle),
  );
});

/**
 * Ticks on a capsule around both players (240 × 140 box), starting at the
 * top centre and running clockwise, so it empties like the round one.
 */
const CAPSULE_TICKS: Tick[] = (() => {
  const radius = 58;
  const straight = 100;
  const arc = Math.PI * radius;
  const length = 2 * straight + 2 * arc;
  const count = 56;
  return Array.from({ length: count }, (_, index) => {
    let distance = (index / count) * length;
    if (distance < straight / 2) {
      return tick(120 + distance, 12, 0, -1);
    }
    distance -= straight / 2;
    if (distance < arc) {
      const angle = -Math.PI / 2 + distance / radius;
      return tick(
        170 + radius * Math.cos(angle),
        70 + radius * Math.sin(angle),
        Math.cos(angle),
        Math.sin(angle),
      );
    }
    distance -= arc;
    if (distance < straight) {
      return tick(170 - distance, 128, 0, 1);
    }
    distance -= straight;
    if (distance < arc) {
      const angle = Math.PI / 2 + distance / radius;
      return tick(
        70 + radius * Math.cos(angle),
        70 + radius * Math.sin(angle),
        Math.cos(angle),
        Math.sin(angle),
      );
    }
    return tick(70 + distance - arc, 12, 0, -1);
  });
})();

function tick(x: number, y: number, nx: number, ny: number): Tick {
  const half = 7;
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    x1: round(x - nx * half),
    y1: round(y - ny * half),
    x2: round(x + nx * half),
    y2: round(y + ny * half),
  };
}

/**
 * TEMPORARY: the favourites «Ring» (M2) and «Verbunden» (M8) merged into a
 * single element: the ring is the countdown, the players are the content.
 */
@Component({
  selector: 'app-match-combo',
  imports: [NgTemplateOutlet],
  templateUrl: './match-combo.component.html',
  styleUrl: './match-combo.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class MatchComboComponent implements OnInit {
  readonly layout = input.required<MatchLayout>();
  readonly playerName = input('');
  readonly opponentName = input('');
  readonly durationMs = input(3000);

  protected readonly circleTicks = CIRCLE_TICKS;
  protected readonly capsuleTicks = CAPSULE_TICKS;

  private readonly remainingMs = signal(0);
  /** Counts the restarts, so animations play again in the preview. */
  protected readonly round = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Share of the countdown that is left, from 1 down to 0. */
  protected readonly left = computed(
    () => this.remainingMs() / Math.max(1, this.durationMs()),
  );
  protected readonly circleFilled = computed(() => Math.round(this.left() * 60));
  protected readonly capsuleFilled = computed(() => Math.round(this.left() * 56));

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
