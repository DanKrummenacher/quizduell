import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  QuizPhase,
  AnswerViewData,
} from '../../quiz.types';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-quiz-question',
  templateUrl: './quiz-question.component.html',
  styleUrl: './quiz-question.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuizQuestionComponent {
  readonly phase = input.required<QuizPhase>();
  readonly questionText = input.required<string>();
  readonly answers = input.required<AnswerViewData[]>();

  readonly feedbackText = input.required<string | null>();
  readonly feedbackType = input.required<'default' | 'success' | 'error' | null>();
  readonly opponentInitial = input.required<string>();

  readonly answerSelected = output<string>();
}
