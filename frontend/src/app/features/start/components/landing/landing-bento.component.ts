import { Component, computed, input, output, signal } from '@angular/core';
import { StartVisualComponent } from '../next/start-visual.component';
import { StartVisualBComponent } from '../next/start-visual-b.component';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

/**
 * TEMPORARY (landing concepts) · L6 Bento Pro: the headline and the name
 * field, then a grid of tiles with small live pieces of the game.
 */
@Component({
  selector: 'app-landing-bento',
  imports: [
    LandingNavComponent,
    LandingNameFormComponent,
    StartVisualComponent,
    StartVisualBComponent,
  ],
  templateUrl: './landing-bento.component.html',
  styleUrl: './landing-bento.component.scss',
})
export class LandingBentoComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly name = signal('');
  protected readonly initial = computed(() =>
    this.name().trim().charAt(0).toUpperCase(),
  );
}
