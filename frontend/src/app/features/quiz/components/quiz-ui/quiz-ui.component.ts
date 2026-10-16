import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import {
  FACEOFF_DEFAULTS,
  type FaceoffOptions,
} from '../../../../core/preview/quiz-header.store';
import { QuizQuestionComponent } from '../quiz-question/quiz-question.component';
import { QuizStatusComponent } from '../quiz-status/quiz-status.component';
import type { QuizPhase, AnswerViewData, FeedbackType } from '../../quiz.types';
import '@css-ch/calc-ui-text';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-quiz-ui',
  imports: [BrandHeaderComponent, QuizStatusComponent, QuizQuestionComponent],
  templateUrl: './quiz-ui.component.html',
  styleUrl: './quiz-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuizUiComponent {
  readonly headerOptions = input<FaceoffOptions>(FACEOFF_DEFAULTS);
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
  readonly feedbackType = input.required<FeedbackType | null>();
  readonly opponentLeft = input<boolean>(false);
  readonly opponentOffline = input<boolean>(false);
  readonly abortTitle = input.required<string>();
  readonly abortText = input.required<string>();

  readonly answerSelected = output<string>();
  readonly acknowledgeOpponentLeft = output<void>();
}
