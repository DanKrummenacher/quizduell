import { Component, input, output } from '@angular/core';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

const BAND = [
  'Wie viele Kantone hat die Schweiz?',
  'Welcher Planet ist der grösste?',
  'Wer malte die Mona Lisa?',
  'Wie hoch ist das Matterhorn?',
  'Wann fiel die Berliner Mauer?',
  'Wie viele Beine hat eine Spinne?',
];

/**
 * TEMPORARY (landing concepts) · L2 Kinetic Type: huge words that reveal
 * themselves, a band of questions across the page, an editorial grid.
 */
@Component({
  selector: 'app-landing-kinetic',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-kinetic.component.html',
  styleUrl: './landing-kinetic.component.scss',
})
export class LandingKineticComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly band = BAND;
}
