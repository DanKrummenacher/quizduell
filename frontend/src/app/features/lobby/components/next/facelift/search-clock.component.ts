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
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { SearchLayout } from '../lobby-design';

/**
 * TEMPORARY: the chosen time ring with second ticks («B2») and a pulse, in
 * different arrangements and wordings.
 */
@Component({
  selector: 'app-search-clock',
  imports: [NgTemplateOutlet],
  templateUrl: './search-clock.component.html',
  styleUrl: './search-clock.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class SearchClockComponent {
  readonly layout = input.required<SearchLayout>();
  readonly cancelSearch = output<void>();

  /** One tick per second of a minute, as on a clock. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);

  private readonly seconds = signal(0);
  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /** Ticks lit in the current minute (all of them on the full minute). */
  protected readonly lit = computed(() => {
    const seconds = this.seconds();
    return seconds > 0 && seconds % 60 === 0 ? 60 : seconds % 60;
  });

  constructor() {
    const timer = setInterval(() => this.seconds.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
