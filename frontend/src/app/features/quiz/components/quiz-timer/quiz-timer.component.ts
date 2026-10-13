import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';

@Component({
  selector: 'app-quiz-timer',
  templateUrl: './quiz-timer.component.html',
  styleUrl: './quiz-timer.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuizTimerComponent {
  readonly timeLeft = input.required<number>();
  readonly timerPercent = input.required<number>();
  readonly isReveal = input.required<boolean>();
}
