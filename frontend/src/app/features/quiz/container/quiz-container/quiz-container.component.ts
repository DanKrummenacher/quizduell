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
import { GameClient } from '../../../../core/game/game-client.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { WakeLockService } from '../../../../core/platform/wake-lock.service';
import { QuizUiComponent } from '../../components/quiz-ui/quiz-ui.component';
import type { AnswerViewData, QuizPhase } from '../../quiz.types';

const LETTERS = ['A', 'B', 'C', 'D'];

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
    () => this.game()?.question?.text ?? 'Warte auf Frage...',
  );

  readonly quizPhase = computed<QuizPhase>(() => {
    const game = this.game();
    if (game?.phase === 'reveal') {
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
    const game = this.game();
    const reveal = game?.reveal;
    const phase = this.quizPhase();
    const selected = reveal ? reveal.yourAnswerIndex : this.selectedIndex();

    return (game?.question?.options ?? []).map((text, index) => {
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
        letter: LETTERS[index] ?? '?',
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
    const reveal = this.game()?.reveal;
    if (!reveal || reveal.yourAnswerIndex === null) {
      return 'Zeit abgelaufen! +0 Punkte';
    }
    if (reveal.yourAnswerIndex === reveal.correctIndex) {
      return `Richtig! +${reveal.yourPoints} Punkte`;
    }
    return 'Falsch! +0 Punkte';
  });

  readonly feedbackType = computed<'default' | 'success' | 'error'>(() => {
    const phase = this.quizPhase();
    if (phase === 'WAITING') {
      return 'default';
    }
    const reveal = this.game()?.reveal;
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
          void this.router.navigate([this.playerNameStore.name() ? '/lobby' : '/']);
        }
        return;
      }
      if (game.phase === 'finished') {
        void this.router.navigate(['/result']);
      } else if (game.phase === 'waiting' || game.phase === 'countdown') {
        void this.router.navigate(['/lobby']);
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
    const answerIndex = LETTERS.indexOf(letter);
    this.selectedIndex.set(answerIndex);
    void this.gameClient.submitAnswer(question.index, answerIndex);
  }

  handleOpponentLeftAcknowledge(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby']);
  }
}
