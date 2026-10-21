import { Component, computed, input, output, signal } from '@angular/core';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

/**
 * TEMPORARY (landing concepts) · L3 Arena: dark, a moving grid floor, you
 * against your opponent; then how a duel runs over the rounds.
 */
@Component({
  selector: 'app-landing-arena',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-arena.component.html',
  styleUrl: './landing-arena.component.scss',
})
export class LandingArenaComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly name = signal('');
  protected readonly cleanName = computed(() =>
    this.name().replace(/\s+/g, ' ').trim(),
  );
  protected readonly initial = computed(() =>
    this.cleanName().charAt(0).toUpperCase(),
  );
  /** A sample duel: the score after each round. */
  protected readonly rounds = computed(() => {
    const scores = [
      { me: 1, opponent: 0 },
      { me: 1, opponent: 1 },
      { me: 2, opponent: 1 },
    ];
    return scores.slice(0, this.questions());
  });
}
