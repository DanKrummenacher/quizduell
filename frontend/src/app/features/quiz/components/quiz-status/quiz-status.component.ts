import {
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  FACEOFF_DEFAULTS,
  type FaceoffOptions,
} from '../../../../core/preview/quiz-header.store';

/** From this many seconds on, the remaining time is shown as a warning. */
const LOW_TIME_SEC = 5;
const POP_MS = 700;

/**
 * Head of the quiz screen «Gegenüber»: both players on two slanted halves,
 * the time in a diamond (one of the logo's shapes) on the dividing line, and
 * the question number below.
 */
@Component({
  selector: 'app-quiz-status',
  templateUrl: './quiz-status.component.html',
  styleUrl: './quiz-status.component.scss',
})
export class QuizStatusComponent {
  readonly options = input<FaceoffOptions>(FACEOFF_DEFAULTS);
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
  protected readonly questionText = computed(
    () => `Frage ${this.currentQuestion()} von ${this.totalQuestions()}`,
  );
  protected readonly timeText = computed(() =>
    this.isReveal()
      ? `Es geht weiter in ${this.timeLeft()} s`
      : `noch ${this.timeLeft()} s`,
  );
  /** The bar and the diamond outline restart at 100 % without animating back. */
  private readonly restarting = computed(() => this.timerPercent() >= 99.5);
  protected readonly barTransition = computed(() =>
    this.restarting() ? 'none' : 'width 0.1s linear',
  );
  protected readonly ringTransition = computed(() =>
    this.restarting() ? 'none' : 'stroke-dashoffset 0.1s linear',
  );

  /** Briefly highlights points that just increased. */
  protected readonly playerPop = this.popOn(this.playerScore);
  protected readonly opponentPop = this.popOn(this.opponentScore);

  private popOn(score: () => number) {
    const pop = signal(false);
    let previous: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect((onCleanup) => {
      const value = score();
      const increased = previous !== null && value > previous;
      previous = value;
      if (increased && untracked(this.options).pop) {
        pop.set(true);
        clearTimeout(timer);
        timer = setTimeout(() => pop.set(false), POP_MS);
      }
      onCleanup(() => clearTimeout(timer));
    });
    return pop.asReadonly();
  }
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
