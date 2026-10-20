import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { SearchLayout } from '../lobby-design';

/** Circumference of the rings (radius 92 in a 200 viewBox). */
const RING = 2 * Math.PI * 92;
/** The dark disc has its ring a little further inside (radius 84). */
const DARK_RING = 2 * Math.PI * 84;

/**
 * TEMPORARY: final search proposals. The facelift with a loading bar and
 * the waiting time, and refinements of the time ring («Puls»).
 */
@Component({
  selector: 'app-search-final',
  templateUrl: './search-final.component.html',
  styleUrl: './search-final.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class SearchFinalComponent {
  readonly layout = input.required<SearchLayout>();
  readonly cancelSearch = output<void>();

  protected readonly ring = RING;
  protected readonly darkRing = DARK_RING;
  /** One tick per second of a minute, as on a clock. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);

  private readonly tenths = signal(0);
  protected readonly seconds = computed(() => Math.floor(this.tenths() / 10));
  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /** The ring fills once per minute. */
  protected readonly ringOffset = computed(
    () => RING * (1 - ((this.tenths() / 10) % 60) / 60),
  );

  protected readonly darkOffset = computed(
    () => (this.ringOffset() / RING) * DARK_RING,
  );

  /** Ticks lit in the current minute (all of them on the full minute). */
  protected readonly litTicks = computed(() => {
    const seconds = this.seconds();
    return seconds > 0 && seconds % 60 === 0 ? 60 : seconds % 60;
  });

  constructor() {
    const timer = setInterval(() => this.tenths.update((value) => value + 1), 100);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
