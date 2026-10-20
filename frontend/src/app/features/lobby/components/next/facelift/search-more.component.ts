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

/** Circumference of the ring in «Puls» (radius 92). */
const RING = 2 * Math.PI * 92;

interface ChatMessage {
  /** Seconds after the start of the search. */
  at: number;
  text: string;
}

const CHAT: ChatMessage[] = [
  { at: 0, text: 'Du bist in der Warteschlange.' },
  { at: 1.5, text: 'Ich suche dir einen passenden Gegner …' },
  { at: 6, text: 'Noch einen Moment. Sobald jemand bereit ist, geht es los.' },
];

/**
 * TEMPORARY: further search proposals (time ring, duel ticket, big
 * typography, chat).
 */
@Component({
  selector: 'app-search-more',
  imports: [LogoMarkComponent],
  templateUrl: './search-more.component.html',
  styleUrl: './search-more.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class SearchMoreComponent {
  readonly layout = input.required<SearchLayout>();
  readonly playerName = input('');
  readonly cancelSearch = output<void>();

  protected readonly ring = RING;
  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );

  private readonly ticks = signal(0);
  private readonly seconds = computed(() => this.ticks() / 10);
  protected readonly elapsed = computed(() => {
    const seconds = Math.floor(this.seconds());
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /** «Puls»: the ring fills once per minute. */
  protected readonly ringOffset = computed(
    () => RING * (1 - (this.seconds() % 60) / 60),
  );

  /** «Chat»: the messages appear one after the other. */
  protected readonly messages = computed(() =>
    CHAT.filter((message) => message.at <= this.seconds()),
  );

  constructor() {
    const timer = setInterval(() => this.ticks.update((value) => value + 1), 100);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
