import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { QuizScoreboardComponent } from '../quiz-scoreboard/quiz-scoreboard.component';
import { QuizTimerComponent } from '../quiz-timer/quiz-timer.component';
import { QuizQuestionComponent } from '../quiz-question/quiz-question.component';
import { QuizPhase, AnswerViewData } from '../../quiz.types';
import '@css-ch/calc-ui-text';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-quiz-ui',
  imports: [QuizScoreboardComponent, QuizTimerComponent, QuizQuestionComponent],
  templateUrl: './quiz-ui.component.html',
  styleUrl: './quiz-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuizUiComponent {
  readonly currentQuestion = input.required<number>();
  readonly totalQuestions = input.required<number>();
  readonly playerName = input.required<string>();
  readonly playerScore = input.required<number>();
  readonly opponentName = input.required<string>();
  readonly opponentScore = input.required<number>();

  readonly timeLeft = input.required<number>();
  readonly timerPercent = input.required<number>();
  readonly quizPhase = input.required<QuizPhase>();

  readonly questionText = input.required<string>();
  readonly answers = input.required<AnswerViewData[]>();
  readonly feedbackText = input.required<string | null>();
  readonly feedbackType = input.required<'default' | 'success' | 'error' | null>();
  readonly opponentLeft = input<boolean>(false);
  readonly opponentOffline = input<boolean>(false);
  readonly abortTitle = input('Schade! Spiel abgebrochen');
  readonly abortText = input(
    'Dein Gegner hat das Spiel vorzeitig verlassen. Das Duell kann deshalb leider nicht fortgesetzt werden.',
  );

  readonly answerSelected = output<string>();
  readonly acknowledgeOpponentLeft = output<void>();
}
