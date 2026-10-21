import { Component, computed, input, output, signal } from '@angular/core';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';
import { LandingNameFormComponent } from './landing-name-form.component';

/**
 * TEMPORARY (landing concepts) · L12 TV-Übertragung: as a live sports
 * broadcast, with a channel bug, a scoreboard, a lower third and a ticker.
 */
@Component({
  selector: 'app-landing-tv',
  imports: [LandingNameFormComponent, LogoMarkComponent],
  templateUrl: './landing-tv.component.html',
  styleUrl: './landing-tv.component.scss',
})
export class LandingTvComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly name = signal('');
  protected readonly cleanName = computed(() =>
    this.name().replace(/\s+/g, ' ').trim(),
  );
  protected readonly shortName = computed(() =>
    (this.cleanName() || 'Du').slice(0, 3).toUpperCase(),
  );
  protected readonly ticker = computed(() => [
    `${this.questions()} Fragen pro Duell`,
    `${this.seconds()} Sekunden pro Frage`,
    'Kein Account nötig',
    'Zufallsgegner oder Freund mit Code',
    'Live in Echtzeit',
  ]);
}
