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
import '@css-ch/components/icon';
import '@css-ch/components/button';
import {
  SEARCH_CLOCK,
  SEARCH_CONCEPTS,
  SEARCH_FINAL,
  type SearchLayout,
} from '../lobby-design';
import { SearchConceptComponent } from './search-concept.component';
import { SearchBandComponent } from './search-band.component';
import { SearchClockComponent } from './search-clock.component';
import { SearchFinalComponent } from './search-final.component';

const TIP_MS = 4500;

const TIPS = [
  'Je schneller du richtig antwortest, desto mehr Punkte gibt es.',
  'Nach dem Duell kannst du direkt eine Revanche fordern.',
  'Mit einem Freund spielst du über einen Code aus vier Zeichen.',
];

@Component({
  selector: 'app-facelift-searching',
  imports: [
    SearchBandComponent,
    SearchConceptComponent,
    SearchFinalComponent,
    SearchClockComponent,
  ],
  host: { '[class.is-concept]': 'isConcept() || isClock()' },
  templateUrl: './facelift-searching.component.html',
  styleUrl: './facelift-searching.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftSearchingComponent {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<SearchLayout>('facelift');
  readonly playerName = input('');

  readonly cancelSearch = output<void>();

  /** Proposals with their own page structure. */
  protected readonly isConcept = computed(() =>
    SEARCH_CONCEPTS.includes(this.layout()),
  );

  protected readonly isFinal = computed(() => SEARCH_FINAL.includes(this.layout()));
  protected readonly isClock = computed(() => SEARCH_CLOCK.includes(this.layout()));

  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );

  /** Seconds since the search started. */
  private readonly seconds = signal(0);
  protected readonly elapsed = computed(() => {
    const seconds = this.seconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  protected readonly tips = TIPS;
  protected readonly tipIndex = computed(
    () => Math.floor((this.seconds() * 1000) / TIP_MS) % TIPS.length,
  );

  constructor() {
    const timer = setInterval(() => this.seconds.update((value) => value + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
