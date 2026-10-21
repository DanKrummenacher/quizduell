import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';

/**
 * TEMPORARY (landing concepts): a phone that plays a question of the real
 * game in a 9 s loop: the time runs, an answer is chosen, it turns green,
 * the score goes up.
 */
@Component({
  selector: 'app-landing-phone',
  imports: [LogoMarkComponent],
  templateUrl: './landing-phone.component.html',
  styleUrl: './landing-phone.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { 'aria-hidden': 'true' },
})
export class LandingPhoneComponent {
  readonly initial = input('');
  readonly questions = input(3);
  /** Which screen of the game the phone shows. */
  readonly screen = input<'name' | 'search' | 'quiz' | 'result'>('quiz');
  readonly name = input('');
}
