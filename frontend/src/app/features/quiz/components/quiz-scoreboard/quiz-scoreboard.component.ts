import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-quiz-scoreboard',
  templateUrl: './quiz-scoreboard.component.html',
  styleUrl: './quiz-scoreboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuizScoreboardComponent {
  readonly playerName = input.required<string>();
  readonly playerScore = input.required<number>();
  readonly opponentName = input.required<string>();
  readonly opponentScore = input.required<number>();
}
