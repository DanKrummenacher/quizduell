import { Component, computed, input } from '@angular/core';
import type { QuizHeaderVariant } from '../../../../core/preview/quiz-header.store';

/** From this many seconds on, the remaining time is shown as a warning. */
const LOW_TIME_SEC = 5;

/**
 * Head of the quiz screen: both players with their points, the question
 * number and the time. Two layouts: «Duell-Karten» (two cards side by side)
 * and «Gegenüber» (two slanted halves with the time on the dividing line).
 */
@Component({
  selector: 'app-quiz-status',
  templateUrl: './quiz-status.component.html',
  styleUrl: './quiz-status.component.scss',
})
export class QuizStatusComponent {
  readonly variant = input<QuizHeaderVariant>('cards');
  readonly playerName = input.required<string>();
  readonly playerScore = input.required<number>();
  readonly opponentName = input.required<string>();
  readonly opponentScore = input.required<number>();
  readonly currentQuestion = input.required<number>();
  readonly totalQuestions = input.required<number>();
  readonly timeLeft = input.required<number>();
  readonly timerPercent = input.required<number>();
  readonly isReveal = input.required<boolean>();

  protected readonly playerInitial = computed(() => initial(this.playerName()));
  protected readonly opponentInitial = computed(() => initial(this.opponentName()));
  protected readonly isLow = computed(
    () => !this.isReveal() && this.timeLeft() <= LOW_TIME_SEC,
  );
  protected readonly timeText = computed(() =>
    this.isReveal()
      ? `Es geht weiter in ${this.timeLeft()} s`
      : `noch ${this.timeLeft()} s`,
  );
  /** The bar restarts at 100 % without animating back. */
  protected readonly barTransition = computed(() =>
    this.timerPercent() >= 99.5 ? 'none' : 'width 0.1s linear',
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
