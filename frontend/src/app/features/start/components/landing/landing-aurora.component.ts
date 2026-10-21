import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

/**
 * TEMPORARY (landing concepts) · L7 Aurora: dark, with a flowing light, a
 * glossy question card floating in space and a shimmering headline.
 */
@Component({
  selector: 'app-landing-aurora',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-aurora.component.html',
  styleUrl: './landing-aurora.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingAuroraComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();
}
