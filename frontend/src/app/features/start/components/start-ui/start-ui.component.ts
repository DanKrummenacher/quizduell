import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  input,
  type OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';

/** Calm: every phrase stays long enough to be read. */
const PHRASE_INTERVAL_MS = 4500;

/** Sample names the empty name field types by itself. */
const SAMPLE_NAMES = ['Anna', 'Luca', 'Mia', 'Noah', 'Lea', 'Elias'];
const TYPE_MIN_MS = 85;
const TYPE_MAX_MS = 150;
const DELETE_MS = 45;
const HOLD_MS = 1600;
const NEXT_NAME_MS = 450;
const CARET_MS = 530;
/** The typing starts after the intro of the page. */
const TYPE_START_MS = 1200;
const STATIC_PLACEHOLDER = 'z.B. Max Mustermann';

/**
 * The start page: a title whose end changes on a turning cube with a
 * marker, the three facts, and the name with the start button. The page
 * comes in with a short intro; the empty name field types sample names.
 */
@Component({
  selector: 'app-start-ui',
  imports: [BrandHeaderComponent],
  templateUrl: './start-ui.component.html',
  styleUrl: './start-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartUiComponent implements OnInit {
  readonly features = input.required<{ icon: string; text: string }[]>();
  /** The time per question, as configured by the admin. */
  readonly seconds = input(20);
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  /** The end of the title changes between these phrases. */
  protected readonly phrases = computed(() => [
    'im direkten Duell',
    'gegen Freunde',
    `in ${this.seconds()} Sekunden`,
    'live und fair',
  ]);
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');

  /** The phrase that turns in and the one that turns away. */
  private readonly phraseIndex = signal(0);
  protected readonly phraseItems = computed(() => {
    const index = this.phraseIndex();
    const phrases = this.phrases();
    const phrase = (i: number) => phrases[i % phrases.length]!;
    const items = [{ key: index, text: phrase(index), out: false }];
    if (index > 0) {
      items.unshift({ key: index - 1, text: phrase(index - 1), out: true });
    }
    return items;
  });
  /** The width of the current phrase, so the title follows smoothly. */
  private readonly phraseWidths = signal<number[]>([]);
  protected readonly phraseWidth = computed(
    () => this.phraseWidths()[this.phraseIndex() % this.phrases().length] ?? null,
  );
  /**
   * The phrase stands on its own line when the longest one would not fit
   * next to «Teste dein Wissen»: decided per width, so the number of lines
   * never changes while the phrases change.
   */
  protected readonly stacked = signal(false);
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');
  private readonly lead = viewChild.required<ElementRef<HTMLElement>>('lead');
  private readonly measure = viewChild.required<ElementRef<HTMLElement>>('measure');

  /** The sample name being typed and the blinking caret. */
  private readonly typedName = signal('');
  private readonly caretOn = signal(true);
  private readonly typing = signal(false);
  protected readonly placeholder = computed(() =>
    this.typing()
      ? `z.B. ${this.typedName()}${this.caretOn() ? '|' : ''}`
      : STATIC_PLACEHOLDER,
  );

  constructor() {
    // The phrases change; the widths are measured with the loaded font and
    // again before every change and after a resize (e.g. a turned phone).
    effect((onCleanup) => {
      // Measured again when the phrases change (the time per question).
      this.phrases();
      let active = true;
      const measure = () => this.measurePhrases();
      void document.fonts.ready.then(() => active && setTimeout(measure));
      window.addEventListener('resize', measure);
      const timer = setInterval(() => {
        measure();
        this.phraseIndex.update((value) => value + 1);
      }, PHRASE_INTERVAL_MS);
      onCleanup(() => {
        active = false;
        window.removeEventListener('resize', measure);
        clearInterval(timer);
      });
    });

    // The empty name field types sample names, unless motion is reduced.
    effect((onCleanup) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      let timer = 0;
      let nameIndex = 0;
      const name = () => SAMPLE_NAMES[nameIndex % SAMPLE_NAMES.length]!;
      const type = (length: number) => {
        this.typedName.set(name().slice(0, length));
        if (length < name().length) {
          const delay = TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS);
          timer = window.setTimeout(() => type(length + 1), delay);
        } else {
          timer = window.setTimeout(() => erase(length), HOLD_MS);
        }
      };
      const erase = (length: number) => {
        this.typedName.set(name().slice(0, length));
        if (length > 0) {
          timer = window.setTimeout(() => erase(length - 1), DELETE_MS);
        } else {
          nameIndex++;
          timer = window.setTimeout(() => type(1), NEXT_NAME_MS);
        }
      };
      this.typing.set(true);
      timer = window.setTimeout(() => type(1), TYPE_START_MS);
      const caret = setInterval(() => this.caretOn.update((on) => !on), CARET_MS);
      onCleanup(() => {
        clearTimeout(timer);
        clearInterval(caret);
      });
    });
  }

  ngOnInit(): void {
    this.playerName.set(this.initialName());
  }

  protected onNameInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = (field.value || '').slice(0, PLAYER_NAME_MAX_LENGTH);
    field.value = value;
    this.playerName.set(value);
    this.errorMessage.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit(): void {
    const name = this.playerName().replace(/\s+/g, ' ').trim();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    this.startGame.emit(name);
  }

  private measurePhrases(): void {
    const widths = Array.from(
      this.measure().nativeElement.children,
      (child) => child.getBoundingClientRect().width,
    );
    this.phraseWidths.set(widths);
    const title = this.title().nativeElement;
    const space = parseFloat(getComputedStyle(title).fontSize) * 0.3;
    const needed =
      this.lead().nativeElement.getBoundingClientRect().width +
      space +
      Math.max(...widths);
    this.stacked.set(needed > title.clientWidth);
  }
}
