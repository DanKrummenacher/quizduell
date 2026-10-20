import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';

/** The angles of the ticks: one per second of a minute, as on a clock. */
const TICKS = Array.from({ length: 60 }, (_, index) => index * 6);

@Component({
  selector: 'app-facelift-searching',
  templateUrl: './facelift-searching.component.html',
  styleUrl: './facelift-searching.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftSearchingComponent {
  readonly cancelSearch = output<void>();

  protected readonly ticks = TICKS;

  /** Seconds since the search started. */
  private readonly seconds = signal(0);

  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /** Ticks filled in the current minute (all of them on the full minute). */
  protected readonly filledTicks = computed(() => {
    const seconds = this.seconds();
    return seconds > 0 && seconds % 60 === 0 ? 60 : seconds % 60;
  });

  constructor() {
    const timer = setInterval(() => this.seconds.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
