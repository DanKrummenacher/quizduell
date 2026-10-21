import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';
import { LandingNameFormComponent } from './landing-name-form.component';

/**
 * TEMPORARY (landing concepts) · L11 Magazin-Cover: a front page with a
 * huge masthead, cover lines and a turning badge that leads to the form.
 */
@Component({
  selector: 'app-landing-cover',
  imports: [LandingNameFormComponent],
  templateUrl: './landing-cover.component.html',
  styleUrl: './landing-cover.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingCoverComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected focusForm(event: Event): void {
    event.preventDefault();
    const field = document.getElementById('playerName');
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
  }
}
