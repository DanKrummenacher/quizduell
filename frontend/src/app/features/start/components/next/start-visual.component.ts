import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { shapeRing } from '../../../../core/branding/logo-shapes';
import type { StartVisual } from './start-design';

const TICKS = 60;

/** TEMPORARY: the large visuals of the start page proposals. */
@Component({
  selector: 'app-start-visual',
  templateUrl: './start-visual.component.html',
  styleUrl: './start-visual.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': "'is-' + kind()", 'aria-hidden': 'true' },
})
export class StartVisualComponent {
  readonly kind = input.required<StartVisual>();
  readonly initial = input('');
  readonly questions = input(3);
  readonly seconds = input(20);

  protected readonly ring = shapeRing();
  protected readonly ticks = Array.from({ length: TICKS }, (_, index) => index * 6);

  /** The timer counts down the time of one question, again and again. */
  private readonly elapsed = signal(0);
  protected readonly remaining = computed(
    () => this.seconds() - (this.elapsed() % (this.seconds() + 1)),
  );
  protected readonly filledTicks = computed(() =>
    Math.round((this.remaining() / this.seconds()) * TICKS),
  );
  protected readonly rounds = computed(() =>
    Array.from({ length: this.questions() }, (_, index) => index),
  );

  constructor() {
    const timer = setInterval(() => this.elapsed.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
