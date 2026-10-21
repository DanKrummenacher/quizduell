import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

/**
 * TEMPORARY (landing concepts) · L9 Schräger Verlauf: an angled band in the
 * moving brand gradient; cards of the game reach over its edge.
 */
@Component({
  selector: 'app-landing-angled',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-angled.component.html',
  styleUrl: './landing-angled.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingAngledComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();
}
