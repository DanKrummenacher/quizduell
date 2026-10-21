import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

/**
 * TEMPORARY (landing concepts) · L10 Antwort-Kacheln: the page is one quiz
 * question. A choice wanders over A, B and C; D is right and turns green.
 */
@Component({
  selector: 'app-landing-answers',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-answers.component.html',
  styleUrl: './landing-answers.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingAnswersComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly answers = [
    { letter: 'A', text: 'Wissen' },
    { letter: 'B', text: 'Tempo' },
    { letter: 'C', text: 'Nerven' },
    { letter: 'D', text: 'Alles davon' },
  ];
}
