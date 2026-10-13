import { Component, computed, input } from '@angular/core';
import { initial } from '../game.models';

/** Short "match found" screen with a 3-2-1 countdown. */
@Component({
  selector: 'app-game-countdown',
  template: `
    <p class="eyebrow">{{ rematch() ? 'Revanche!' : 'Gegner gefunden' }}</p>
    <div class="versus">
      <div class="player">
        <span class="avatar you">{{ youInitial() }}</span>
        <span class="name">{{ you() }}</span>
      </div>
      <span class="vs" aria-label="gegen">VS</span>
      <div class="player">
        <span class="avatar">{{ opponentInitial() }}</span>
        <span class="name">{{ opponent() }}</span>
      </div>
    </div>
    <p class="countdown" role="timer" aria-live="assertive">
      @if (seconds() > 0) {
        <!-- Re-created every second so the pop animation restarts. -->
        @for (value of [seconds()]; track value) {
          <span class="number">{{ value }}</span>
        }
      } @else {
        <span class="go">Los!</span>
      }
    </p>
    <p class="hint">Mach dich bereit …</p>
  `,
  styleUrl: './game-countdown.component.scss',
})
export class GameCountdownComponent {
  readonly rematch = input(false);
  readonly you = input.required<string>();
  readonly opponent = input.required<string>();
  readonly remainingMs = input.required<number>();

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  protected readonly youInitial = computed(() => initial(this.you()));
  protected readonly opponentInitial = computed(() => initial(this.opponent()));
}
