import {
  Component,
  signal,
  computed,
  inject,
  effect,
  OnDestroy,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { QuizUiComponent } from '../../components/quiz-ui/quiz-ui.component';
import { GameSocketService } from '../../../../core/services/game-socket.service';
import { QuizPhase } from '../../quiz.types';

@Component({
  selector: 'app-quiz-container',
  imports: [QuizUiComponent],
  templateUrl: './quiz-container.component.html',
})
export class QuizContainerComponent implements OnDestroy {
  private readonly socketService = inject(GameSocketService);
  private readonly router = inject(Router);

  readonly currentQuestion = computed(() => {
    const session = this.socketService.session();
    return session ? session.currentQuestionIndex + 1 : 1;
  });
  readonly totalQuestions = computed(
    () => this.socketService.session()?.totalQuestions ?? 7,
  );
  readonly quizPhase = signal<QuizPhase>('PLAYING');

  readonly playerName = computed(() => {
    const session = this.socketService.session();
    const myId = this.socketService.getSocketId();
    return session?.players[myId]?.name || 'Du';
  });

  readonly playerScore = computed(() => {
    const session = this.socketService.session();
    const myId = this.socketService.getSocketId();
    return session?.players[myId]?.score || 0;
  });

  readonly opponentName = computed(() => {
    const session = this.socketService.session();
    const myId = this.socketService.getSocketId();
    const opponent = Object.values(session?.players || {}).find(
      (p) => p.socketId !== myId,
    );
    return opponent?.name || 'Gegner';
  });

  readonly opponentScore = computed(() => {
    const session = this.socketService.session();
    const myId = this.socketService.getSocketId();
    const opponent = Object.values(session?.players || {}).find(
      (p) => p.socketId !== myId,
    );
    return opponent?.score || 0;
  });

  private previousScore = 0;
  private pointsEarnedThisRound = signal<number>(0);

  readonly timeTotal = signal<number>(0);
  readonly timeLeftMs = signal<number>(0);
  readonly timeLeft = computed(() => Math.ceil(this.timeLeftMs() / 1000));
  readonly timerPercent = computed(
    () => (this.timeLeftMs() / (this.timeTotal() * 1000)) * 100,
  );
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private localQuestionStartTimeMs = 0;

  readonly questionText = computed(
    () => this.socketService.currentQuestion()?.text || 'Warte auf Frage...',
  );

  readonly correctLetter = signal<string | null>(null);
  readonly selectedLetter = signal<string | null>(null);
  readonly opponentLetter = signal<string | null>(null);

  readonly rawAnswers = computed(() => {
    const q = this.socketService.currentQuestion();
    if (!q) return [];
    const letters = ['A', 'B', 'C', 'D'];
    return q.options.map((text, i) => ({ letter: letters[i], text }));
  });

  constructor() {
    if (!this.socketService.session()) {
      void this.router.navigate(['/']);
      return;
    }

    effect(() => {
      const q = this.socketService.currentQuestion();
      if (q) {
        this.quizPhase.set('PLAYING');
        this.selectedLetter.set(null);
        this.correctLetter.set(null);

        this.startTimer(q.totalDurationMs, q.endTimeMs);
        this.localQuestionStartTimeMs = Date.now();
        this.previousScore = untracked(() => this.playerScore());
      }
    });

    effect(() => {
      const result = this.socketService.roundResult();
      if (result) {
        this.quizPhase.set('REVEAL');
        const letters = ['A', 'B', 'C', 'D'];
        this.correctLetter.set(letters[result.correctAnswer]);

        this.pointsEarnedThisRound.set(this.playerScore() - this.previousScore);

        this.startTimer(result.totalDurationMs, result.nextRoundStartTimeMs);
      }
    });

    effect(() => {
      if (this.socketService.gameOver()) {
        void this.router.navigate(['/result']);
      }
    });

    effect(() => {
      if (this.socketService.opponentLeft()) {
        window.alert(
          'Dein Gegner hat das Spiel verlassen. Das Spiel wurde abgebrochen.',
        );
        this.socketService.resetGame();
        void this.router.navigate(['/']);
      }
    });
  }

  private startTimer(durationMs: number, targetEndTimeMs: number) {
    if (this.timerInterval !== null) clearInterval(this.timerInterval);
    this.timeTotal.set(Math.ceil(durationMs / 1000));

    const updateTime = () => {
      const remainingMs = Math.max(0, targetEndTimeMs - Date.now());
      this.timeLeftMs.set(remainingMs);
      if (remainingMs <= 0 && this.timerInterval !== null) {
        clearInterval(this.timerInterval);
      }
    };

    updateTime();
    this.timerInterval = setInterval(updateTime, 50);
  }

  ngOnDestroy() {
    if (this.timerInterval !== null) clearInterval(this.timerInterval);
  }

  readonly answersView = computed(() => {
    const phase = this.quizPhase();
    const selected = this.selectedLetter();
    const correct = this.correctLetter();
    const opponent = this.opponentLetter();

    return this.rawAnswers().map((ans) => {
      let state: 'default' | 'selected' | 'correct' | 'wrong' = 'default';

      if (phase === 'WAITING' && ans.letter === selected) {
        state = 'selected';
      } else if (phase === 'REVEAL') {
        if (ans.letter === correct) {
          state = 'correct';
        } else if (ans.letter === selected && selected !== correct) {
          state = 'wrong';
        }
      }

      return {
        letter: ans.letter,
        text: ans.text,
        state,
        hasOpponent: phase === 'REVEAL' && ans.letter === opponent,
      };
    });
  });

  readonly feedbackText = computed(() => {
    const phase = this.quizPhase();
    if (phase === 'PLAYING') return null;
    if (phase === 'WAITING') return 'Warte auf den Gegner...';

    const selected = this.selectedLetter();
    const correct = this.correctLetter();
    const points = this.pointsEarnedThisRound();

    if (selected === null || selected === undefined) {
      return 'Zeit abgelaufen! +0 Punkte';
    }

    if (selected === correct) {
      return `Richtig! +${points} Punkte`;
    }

    return 'Falsch! +0 Punkte';
  });

  readonly feedbackType = computed(() => {
    const phase = this.quizPhase();
    if (phase === 'WAITING') return 'default';
    if (!this.selectedLetter() || this.selectedLetter() !== this.correctLetter())
      return 'error';
    return 'success';
  });

  handleAnswer(letter: string) {
    if (this.quizPhase() !== 'PLAYING') return;

    this.selectedLetter.set(letter);
    this.quizPhase.set('WAITING');

    const letters = ['A', 'B', 'C', 'D'];
    const answerIndex = letters.indexOf(letter);

    const timeTakenMs = Math.max(0, Date.now() - this.localQuestionStartTimeMs);
    const session = this.socketService.session();

    if (session) {
      this.socketService.submitAnswer(session.gameCode, answerIndex, timeTakenMs);
    }
  }
}
