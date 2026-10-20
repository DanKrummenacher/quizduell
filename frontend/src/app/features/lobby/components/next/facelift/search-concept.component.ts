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
import { FaceliftModeComponent } from './facelift-mode.component';
import { SearchIdeasComponent } from './search-ideas.component';

/**
 * TEMPORARY: search proposals with their own page structure (stage, two
 * seats, steps, sheet over the mode choice).
 */
@Component({
  selector: 'app-search-concept',
  imports: [FaceliftModeComponent, SearchIdeasComponent],
  templateUrl: './search-concept.component.html',
  styleUrl: './search-concept.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class SearchConceptComponent {
  readonly layout = input.required<SearchLayout>();
  readonly playerName = input('');
  readonly cancelSearch = output<void>();

  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );

  private readonly seconds = signal(0);
  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  constructor() {
    const timer = setInterval(() => this.seconds.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
