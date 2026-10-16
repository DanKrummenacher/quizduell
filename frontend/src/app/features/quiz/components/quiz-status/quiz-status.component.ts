import { Component, computed, effect, input, signal } from '@angular/core';

/** From this many seconds on, the remaining time is shown as a warning. */
const LOW_TIME_SEC = 5;
const POP_MS = 700;

/**
 * Head of the quiz screen «Gegenüber»: both players on two slanted halves,
 * the question number in a diamond (one of the logo's shapes) on the dividing
 * line, and the remaining time with a time bar below.
 */
@Component({
  selector: 'app-quiz-status',
  templateUrl: './quiz-status.component.html',
  styleUrl: './quiz-status.component.scss',
})
export class QuizStatusComponent {
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

  /** Briefly highlights points that just increased. */
  protected readonly playerPop = popOnIncrease(this.playerScore);
  protected readonly opponentPop = popOnIncrease(this.opponentScore);
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/** A flag that is true for a moment whenever `score` increases. */
function popOnIncrease(score: () => number) {
  const pop = signal(false);
  let previous: number | null = null;
  effect((onCleanup) => {
    const value = score();
    const increased = previous !== null && value > previous;
    previous = value;
    if (increased) {
      pop.set(true);
      const timer = setTimeout(() => pop.set(false), POP_MS);
      onCleanup(() => clearTimeout(timer));
    }
  });
  return pop.asReadonly();
}
