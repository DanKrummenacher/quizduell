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
import { LogoMarkComponent } from '../../../../../core/ui/logo-mark/logo-mark.component';
import type { SearchLayout } from '../lobby-design';

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWZ';
const COLORS = ['#00a4e0', '#0078bb', '#00875e', '#00327d'];

interface WarmupQuestion {
  text: string;
  options: string[];
  correct: number;
}

// Unscored warm-up questions while waiting (a final version would load
// them from the server).
const KANTONE: WarmupQuestion = {
  text: 'Wie viele Kantone hat die Schweiz?',
  options: ['23', '26', '24', '28'],
  correct: 1,
};

const WARMUP: WarmupQuestion[] = [
  KANTONE,
  {
    text: 'Welcher Planet ist der Sonne am nächsten?',
    options: ['Venus', 'Mars', 'Merkur', 'Jupiter'],
    correct: 2,
  },
  {
    text: 'Wie viele Bits hat ein Byte?',
    options: ['4', '8', '16', '10'],
    correct: 1,
  },
];

/**
 * TEMPORARY: more search proposals with new ideas (opponent drawn like a
 * slot machine, warm-up round, logo loader, split screen).
 */
@Component({
  selector: 'app-search-ideas',
  imports: [LogoMarkComponent],
  templateUrl: './search-ideas.component.html',
  styleUrl: './search-ideas.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class SearchIdeasComponent {
  readonly layout = input.required<SearchLayout>();
  readonly playerName = input('');
  readonly cancelSearch = output<void>();

  protected readonly letters = ['A', 'B', 'C', 'D'];
  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );

  private readonly ticks = signal(0);
  protected readonly elapsed = computed(() => {
    const seconds = Math.floor(this.ticks() / 10);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /** «Gegner wird ausgelost»: a new face every 150 ms. */
  protected readonly slotLetter = computed(
    () => LETTERS[Math.floor(this.ticks() / 1.5) % LETTERS.length],
  );
  protected readonly slotColor = computed(
    () => COLORS[Math.floor(this.ticks() / 1.5) % COLORS.length],
  );

  /** «Aufwärmrunde» */
  protected readonly questionIndex = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly question = computed(
    () => WARMUP[this.questionIndex()] ?? KANTONE,
  );

  protected pick(index: number): void {
    if (this.picked() !== null) {
      return;
    }
    this.picked.set(index);
    setTimeout(() => {
      this.picked.set(null);
      this.questionIndex.update((value) => (value + 1) % WARMUP.length);
    }, 1800);
  }

  constructor() {
    const timer = setInterval(() => this.ticks.update((value) => value + 1), 100);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
