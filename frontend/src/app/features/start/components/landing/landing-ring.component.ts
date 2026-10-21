import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

const TICKS = 60;

/**
 * TEMPORARY (landing concepts) · L8 Countdown-Ring: the ring of the search,
 * very large, counts down the time of one question around the headline.
 */
@Component({
  selector: 'app-landing-ring',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-ring.component.html',
  styleUrl: './landing-ring.component.scss',
})
export class LandingRingComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly ticks = Array.from({ length: TICKS }, (_, index) => index * 6);

  private readonly elapsed = signal(0);
  protected readonly remaining = computed(
    () => this.seconds() - (this.elapsed() % (this.seconds() + 1)),
  );
  protected readonly filledTicks = computed(() =>
    Math.round((this.remaining() / this.seconds()) * TICKS),
  );

  constructor() {
    const timer = setInterval(() => this.elapsed.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
