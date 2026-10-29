import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  type OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import type { GameStateView } from '../../../../core/contracts/game.contract';
import { ANSWER_LETTERS } from '../../../../core/game/answer-letters';
import { GAME_SCREEN_NAVIGATION } from '../../../../core/game/game-screen';
import { GameClient } from '../../../../core/game/game-client.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { WakeLockService } from '../../../../core/platform/wake-lock.service';
import { QuizUiComponent } from '../../components/quiz-ui/quiz-ui.component';
import type { AnswerViewData, FeedbackType, QuizPhase } from '../../quiz.types';

@Component({
  selector: 'app-quiz-container',
  imports: [QuizUiComponent],
  templateUrl: './quiz-container.component.html',
})
export class QuizContainerComponent implements OnDestroy {
  private readonly gameClient = inject(GameClient);
  private readonly router = inject(Router);
  private readonly wakeLock = inject(WakeLockService);
  private readonly playerNameStore = inject(PlayerNameStore);

  private readonly game = this.gameClient.state;
  private readonly now = signal(this.gameClient.serverNow());
  /**
   * The last question with its reveal. Once the duel is finished the state
   * carries no question any more; the page keeps showing the last reveal
   * until the result page takes over, so nothing empty flashes in between.
   */
  private readonly lastRound = signal<{
    question: NonNullable<GameStateView['question']>;
    reveal: GameStateView['reveal'];
  } | null>(null);
  private readonly shown = computed(() => {
    const game = this.game();
    return game?.question
      ? { question: game.question, reveal: game.reveal }
      : (this.lastRound() ?? { question: null, reveal: null });
  });
  /** Answer chosen locally, shown immediately before the server confirms it. */
  private readonly selectedIndex = signal<number | null>(null);

  readonly currentQuestion = computed(() => this.game()?.questionNumber ?? 1);
  readonly totalQuestions = computed(() => this.game()?.totalQuestions ?? 7);
  readonly playerName = computed(() => this.game()?.you.name ?? 'Du');
  readonly playerScore = computed(() => this.game()?.you.score ?? 0);
  readonly opponentName = computed(() => this.game()?.opponent?.name ?? 'Gegner');
  readonly opponentScore = computed(() => this.game()?.opponent?.score ?? 0);
  readonly opponentLeft = computed(() => this.game()?.phase === 'aborted');
  /** The opponent lost the connection and has a short grace period to return. */
  readonly opponentOffline = computed(() => {
    const game = this.game();
    return !!game?.opponent && !game.opponent.connected && game.phase !== 'aborted';
  });
  readonly abortMessage = computed(() => {
    switch (this.game()?.endReason) {
      case 'opponent-disconnected':
        return {
          title: 'Schade! Verbindung verloren',
          text: 'Die Verbindung zu deinem Gegner ist abgebrochen. Das Duell kann deshalb leider nicht fortgesetzt werden.',
        };
      case 'expired':
        return {
          title: 'Spiel beendet',
          text: 'Deine Verbindung war zu lange unterbrochen. Das Duell wurde deshalb beendet.',
        };
      default:
        return {
          title: 'Schade! Spiel abgebrochen',
          text: 'Dein Gegner hat das Spiel vorzeitig verlassen. Das Duell kann deshalb leider nicht fortgesetzt werden.',
        };
    }
  });
  readonly questionText = computed(
    () => this.shown().question?.text ?? 'Warte auf Frage...',
  );

  readonly quizPhase = computed<QuizPhase>(() => {
    const game = this.game();
    if (game?.phase === 'reveal' || game?.phase === 'finished') {
      return 'REVEAL';
    }
    return this.selectedIndex() !== null || game?.you.hasAnswered
      ? 'WAITING'
      : 'PLAYING';
  });

  readonly timeLeftMs = computed(() => {
    const endsAt = this.game()?.phaseEndsAt;
    return endsAt ? Math.max(0, endsAt - this.now()) : 0;
  });
  readonly timeLeft = computed(() => Math.ceil(this.timeLeftMs() / 1000));
  readonly timerPercent = computed(() => {
    const total = this.game()?.phaseDurationMs ?? 0;
    return total > 0 ? Math.min(100, (this.timeLeftMs() / total) * 100) : 0;
  });

  readonly answersView = computed<AnswerViewData[]>(() => {
    const { question, reveal } = this.shown();
    const phase = this.quizPhase();
    const selected = reveal ? reveal.yourAnswerIndex : this.selectedIndex();

    return (question?.options ?? []).map((text, index) => {
      let state: AnswerViewData['state'] = 'default';
      if (phase === 'WAITING' && index === selected) {
        state = 'selected';
      } else if (phase === 'REVEAL' && reveal) {
        if (index === reveal.correctIndex) {
          state = 'correct';
        } else if (index === selected) {
          state = 'wrong';
        }
      }
      return {
        letter: ANSWER_LETTERS[index] ?? '?',
        text,
        state,
        hasOpponent: phase === 'REVEAL' && reveal?.opponentAnswerIndex === index,
      };
    });
  });

  readonly feedbackText = computed(() => {
    const phase = this.quizPhase();
    if (phase === 'PLAYING') {
      return null;
    }
    if (phase === 'WAITING') {
      return 'Warte auf den Gegner...';
    }
    const reveal = this.shown().reveal;
    if (reveal?.yourAnswerIndex === undefined || reveal.yourAnswerIndex === null) {
      return 'Zeit abgelaufen! +0 Punkte';
    }
    if (reveal.yourAnswerIndex === reveal.correctIndex) {
      return `Richtig! +${reveal.yourPoints} Punkte`;
    }
    return 'Falsch! +0 Punkte';
  });

  readonly feedbackType = computed<FeedbackType>(() => {
    const phase = this.quizPhase();
    if (phase === 'WAITING') {
      return 'default';
    }
    const reveal = this.shown().reveal;
    return reveal && reveal.yourAnswerIndex === reveal.correctIndex
      ? 'success'
      : 'error';
  });

  constructor() {
    const ticker = setInterval(() => this.now.set(this.gameClient.serverNow()), 100);
    inject(DestroyRef).onDestroy(() => clearInterval(ticker));
    void this.wakeLock.enable();

    effect(() => {
      const game = this.game();
      if (!game) {
        if (!this.gameClient.resuming()) {
          void this.router.navigate(
            [this.playerNameStore.name() ? '/lobby' : '/'],
            GAME_SCREEN_NAVIGATION,
          );
        }
        return;
      }
      if (game.phase === 'finished') {
        void this.router.navigate(['/result'], GAME_SCREEN_NAVIGATION);
      } else if (game.phase === 'waiting' || game.phase === 'countdown') {
        void this.router.navigate(['/lobby'], GAME_SCREEN_NAVIGATION);
      }
    });

    effect(() => {
      const game = this.game();
      if (game?.question) {
        untracked(() =>
          this.lastRound.set({ question: game.question!, reveal: game.reveal }),
        );
      }
    });

    // Forget the local answer whenever a new question starts.
    let lastQuestion: number | null = null;
    effect(() => {
      const game = this.game();
      const index =
        game?.phase === 'question' ? (game.question?.index ?? null) : null;
      if (index !== lastQuestion) {
        lastQuestion = index;
        untracked(() => this.selectedIndex.set(null));
      }
    });
  }

  ngOnDestroy(): void {
    void this.wakeLock.disable();
  }

  handleAnswer(letter: string): void {
    const question = this.game()?.question;
    if (this.quizPhase() !== 'PLAYING' || !question) {
      return;
    }
    const answerIndex = ANSWER_LETTERS.indexOf(letter);
    this.selectedIndex.set(answerIndex);
    void this.gameClient.submitAnswer(question.index, answerIndex);
  }

  handleOpponentLeftAcknowledge(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby'], GAME_SCREEN_NAVIGATION);
  }
}
