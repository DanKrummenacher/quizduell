import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import type { GameStateView } from '../../../core/contracts/game.contract';
import {
  ANSWER_LETTERS,
  type AnswerOptionView,
  type Feedback,
  initial,
} from '../game.models';

/** Question and reveal phase: scoreboard, timer, question and answers. */
@Component({
  selector: 'app-game-quiz',
  templateUrl: './game-quiz.component.html',
  styleUrl: './game-quiz.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameQuizComponent {
  readonly state = input.required<GameStateView>();
  /** Answer picked locally, shown before the server confirms it. */
  readonly selectedIndex = input<number | null>(null);
  readonly remainingMs = input.required<number>();
  readonly answer = output<number>();

  protected readonly isReveal = computed(() => this.state().phase === 'reveal');
  protected readonly youInitial = computed(() => initial(this.state().you.name));
  protected readonly opponentInitial = computed(() =>
    initial(this.state().opponent?.name),
  );
  protected readonly secondsLeft = computed(() =>
    Math.ceil(this.remainingMs() / 1000),
  );
  protected readonly progress = computed(() => {
    const duration = this.state().phaseDurationMs ?? 1;
    return Math.max(0, Math.min(1, this.remainingMs() / duration));
  });
  protected readonly urgent = computed(
    () => !this.isReveal() && this.remainingMs() <= 5_000 && this.remainingMs() > 0,
  );
  protected readonly locked = computed(
    () =>
      this.isReveal() ||
      this.selectedIndex() !== null ||
      this.state().you.hasAnswered,
  );

  protected readonly options = computed<AnswerOptionView[]>(() => {
    const state = this.state();
    const reveal = state.reveal;
    const selected = reveal ? reveal.yourAnswerIndex : this.selectedIndex();
    return (state.question?.options ?? []).map((text, index) => {
      let answerState: AnswerOptionView['state'] = 'idle';
      if (reveal) {
        if (index === reveal.correctIndex) {
          answerState = 'correct';
        } else if (index === selected) {
          answerState = 'wrong';
        } else {
          answerState = 'dimmed';
        }
      } else if (selected !== null) {
        answerState = index === selected ? 'selected' : 'dimmed';
      }
      return {
        index,
        letter: ANSWER_LETTERS[index] ?? '?',
        text,
        state: answerState,
        pickedByYou: reveal !== null && reveal.yourAnswerIndex === index,
        pickedByOpponent: reveal !== null && reveal.opponentAnswerIndex === index,
      };
    });
  });

  protected readonly feedback = computed<Feedback | null>(() => {
    const state = this.state();
    const reveal = state.reveal;
    if (!reveal) {
      if (this.selectedIndex() !== null || state.you.hasAnswered) {
        return state.opponent?.hasAnswered
          ? { kind: 'waiting', text: 'Auswertung …' }
          : {
              kind: 'waiting',
              text: `Warte auf ${state.opponent?.name ?? 'deinen Gegner'} …`,
            };
      }
      return null;
    }
    if (reveal.yourAnswerIndex === null) {
      return { kind: 'neutral', text: 'Zeit abgelaufen', points: 0 };
    }
    return reveal.yourAnswerIndex === reveal.correctIndex
      ? { kind: 'success', text: 'Richtig!', points: reveal.yourPoints }
      : { kind: 'error', text: 'Leider falsch', points: 0 };
  });

  protected select(option: AnswerOptionView): void {
    if (!this.locked()) {
      this.answer.emit(option.index);
    }
  }
}
