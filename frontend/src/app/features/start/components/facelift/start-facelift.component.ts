import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  type OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { shapeRing } from '../../../../core/branding/logo-shapes';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import {
  StartBackdropComponent,
  type StartBackdropKind,
} from './start-backdrop.component';
import { StartNetworkComponent } from './start-network.component';

/**
 * TEMPORARY: «pure» is the facelift of today's start page; the others add
 * motion on top of the very same page.
 */
export type StartFaceliftVariant =
  | 'pure'
  | 'intro'
  | 'logo'
  | 'live'
  | 'shapes'
  | 'aurora'
  | 'grid'
  | 'spotlight'
  | 'kinetic'
  | 'holo'
  | 'typewriter'
  | 'persona'
  | 'confetti'
  | 'parallax'
  | 'counter'
  | 'liquid'
  | 'wordswap'
  | 'focus'
  | 'path'
  | 'network'
  | 'final-intro'
  | 'final-roll'
  | 'final-typer'
  | 'final-intro-roll'
  | 'final-intro-typer'
  | 'final-all';

const TITLE = 'Teste dein Wissen im direkten Duell';

/** TEMPORARY (variants): names the empty field types by itself. */
const SAMPLE_NAMES = ['Anna', 'Luca', 'Mia', 'Noah', 'Lea', 'Elias'];
const TYPE_STEP_MS = 110;
/** TEMPORARY (variants): the confetti flies before the lobby opens. */
const CONFETTI_MS = 700;
const COUNT_MS = 1200;

/** Final candidates: the words that roll through the title. */
const ROLL_WORDS = ['direkten', 'schnellen', 'fairen', 'spannenden'];
const ROLL_INTERVAL_MS = 2800;
/** Final candidates: a natural typing rhythm for the sample names. */
const TYPE_MIN_MS = 85;
const TYPE_MAX_MS = 150;
const DELETE_MS = 45;
const HOLD_MS = 1600;
const NEXT_NAME_MS = 450;
const CARET_MS = 530;

/**
 * The start page in the design system of the lobby: the same content as
 * before (title, three facts, name, start), with its type scale, symbols
 * and spacing.
 */
@Component({
  selector: 'app-start-facelift',
  imports: [BrandHeaderComponent, StartBackdropComponent, StartNetworkComponent],
  templateUrl: './start-facelift.component.html',
  // TEMPORARY: the second file holds the variants on top of the facelift.
  styleUrls: [
    './start-facelift.component.scss',
    './start-facelift-fx.component.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    '[class]': "'is-' + variant()",
    '[class.has-focus]': 'formFocused()',
    '[class.has-intro]': 'hasIntro()',
    '[class.is-ready]': "cleanName() !== ''",
    '[style.--px]': 'pointerX()',
    '[style.--py]': 'pointerY()',
    '(window:pointermove)': 'onPointerMove($event)',
  },
})
export class StartFaceliftComponent implements OnInit {
  readonly features = input.required<{ icon: string; text: string }[]>();
  readonly seconds = input(20);
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly variant = input<StartFaceliftVariant>('pure');
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly titleWords = TITLE.split(' ');
  /** TEMPORARY (variants): the layer behind the page, if any. */
  protected readonly backdrop = computed<StartBackdropKind | null>(() => {
    const variant = this.variant();
    return variant === 'aurora' || variant === 'grid' || variant === 'spotlight'
      ? variant
      : null;
  });
  protected readonly ring = shapeRing();
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');
  protected readonly cleanName = computed(() =>
    this.playerName().replace(/\s+/g, ' ').trim(),
  );

  /** Final candidates: which parts the variant uses. */
  protected readonly hasIntro = computed(() =>
    ['final-intro', 'final-intro-roll', 'final-intro-typer', 'final-all'].includes(
      this.variant(),
    ),
  );
  protected readonly hasRoll = computed(() =>
    ['final-roll', 'final-intro-roll', 'final-all'].includes(this.variant()),
  );
  protected readonly hasTyper = computed(() =>
    ['final-typer', 'final-intro-typer', 'final-all'].includes(this.variant()),
  );

  /** The title up to the rolling word. */
  protected readonly rollLead = ['Teste', 'dein', 'Wissen', 'im'];
  protected readonly rollWords = ROLL_WORDS;
  private readonly rollIndex = signal(0);
  /** The word that rolls in and the one that rolls out. */
  protected readonly rollItems = computed(() => {
    const index = this.rollIndex();
    const word = (i: number) => ROLL_WORDS[i % ROLL_WORDS.length]!;
    const items = [{ key: index, word: word(index), out: false }];
    if (index > 0) {
      items.unshift({ key: index - 1, word: word(index - 1), out: true });
    }
    return items;
  });
  /** The width of the current word, so the title moves smoothly. */
  private readonly rollWidths = signal<number[]>([]);
  protected readonly rollWidth = computed(
    () => this.rollWidths()[this.rollIndex() % ROLL_WORDS.length] ?? null,
  );
  private readonly rollMeasure = viewChild<ElementRef<HTMLElement>>('rollMeasure');

  /** The sample name being typed and the blinking caret. */
  private readonly typedName = signal('');
  private readonly caretOn = signal(true);

  /** TEMPORARY (wordswap): the words that roll through the title. */
  protected readonly swapWords = ['direkten', 'schnellen', 'fairen', 'spannenden'];
  protected readonly swapIndex = signal(0);
  /** TEMPORARY (focus): the name field has the focus. */
  protected readonly formFocused = signal(false);

  /** TEMPORARY (typewriter): the placeholder types sample names. */
  protected readonly typed = signal('');
  protected readonly placeholder = computed(() => {
    if (this.hasTyper()) {
      return `z.B. ${this.typedName()}${this.caretOn() ? '|' : ''}`;
    }
    return this.variant() === 'typewriter'
      ? `${this.typed()}|`
      : 'z.B. Max Mustermann';
  });
  private typeTick = 0;

  /** TEMPORARY (confetti): the burst after a valid start. */
  protected readonly bursting = signal(false);
  protected readonly confetti = Array.from({ length: 16 }, (_, index) => ({
    angle: index * 22.5 + (index % 2) * 8,
    distance: 70 + (index % 3) * 26,
    color: this.ring[index % 8]!.color,
    round: index % 4 === 3,
  }));

  /** TEMPORARY (parallax): where the mouse is, from -1 to 1. */
  protected readonly pointerX = signal(0);
  protected readonly pointerY = signal(0);

  /** TEMPORARY (counter): the numbers of the facts count up (0 to 1). */
  protected readonly countProgress = signal(1);

  constructor() {
    const typer = setInterval(() => this.typeStep(), TYPE_STEP_MS);
    const swapper = setInterval(
      () => this.swapIndex.update((value) => value + 1),
      2500,
    );
    inject(DestroyRef).onDestroy(() => {
      clearInterval(typer);
      clearInterval(swapper);
    });

    // Final candidates: the word rolls through the title.
    effect((onCleanup) => {
      if (!this.hasRoll()) {
        this.rollIndex.set(0);
        return;
      }
      // The widths are measured once the hidden words are on the page.
      const measure = setTimeout(() => {
        const element = this.rollMeasure()?.nativeElement;
        if (element) {
          this.rollWidths.set(
            Array.from(
              element.children,
              (child) => (child as HTMLElement).offsetWidth,
            ),
          );
        }
      });
      const roller = setInterval(
        () => this.rollIndex.update((value) => value + 1),
        ROLL_INTERVAL_MS,
      );
      onCleanup(() => {
        clearTimeout(measure);
        clearInterval(roller);
      });
    });

    // Final candidates: the placeholder types sample names.
    effect((onCleanup) => {
      if (!this.hasTyper()) {
        return;
      }
      let timer = 0;
      let nameIndex = 0;
      const type = (length: number) => {
        const name = SAMPLE_NAMES[nameIndex % SAMPLE_NAMES.length]!;
        this.typedName.set(name.slice(0, length));
        if (length < name.length) {
          const delay = TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS);
          timer = window.setTimeout(() => type(length + 1), delay);
        } else {
          timer = window.setTimeout(() => erase(length), HOLD_MS);
        }
      };
      const erase = (length: number) => {
        const name = SAMPLE_NAMES[nameIndex % SAMPLE_NAMES.length]!;
        this.typedName.set(name.slice(0, length));
        if (length > 0) {
          timer = window.setTimeout(() => erase(length - 1), DELETE_MS);
        } else {
          nameIndex++;
          timer = window.setTimeout(() => type(1), NEXT_NAME_MS);
        }
      };
      timer = window.setTimeout(() => type(1), this.hasIntro() ? 1200 : 400);
      const caret = setInterval(() => this.caretOn.update((on) => !on), CARET_MS);
      onCleanup(() => {
        clearTimeout(timer);
        clearInterval(caret);
        this.typedName.set('');
      });
    });

    effect((onCleanup) => {
      if (this.variant() !== 'counter') {
        this.countProgress.set(1);
        return;
      }
      const start = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        const t = Math.min((now - start) / COUNT_MS, 1);
        this.countProgress.set(1 - (1 - t) ** 3);
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        }
      };
      frame = requestAnimationFrame(tick);
      onCleanup(() => cancelAnimationFrame(frame));
    });
  }

  ngOnInit(): void {
    this.playerName.set(this.initialName());
  }

  /** TEMPORARY (counter): the text of a fact while its number counts. */
  protected factText(text: string): string {
    const progress = this.countProgress();
    if (progress >= 1) {
      return text;
    }
    // «1 vs 1» stays as it is; only real amounts count.
    return text.replace(/\d+/, (number) =>
      Number(number) < 2 ? number : String(Math.round(Number(number) * progress)),
    );
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.variant() !== 'parallax') {
      return;
    }
    this.pointerX.set((event.clientX / window.innerWidth) * 2 - 1);
    this.pointerY.set((event.clientY / window.innerHeight) * 2 - 1);
  }

  /** Types a name, waits, deletes it, then the next one. */
  private typeStep(): void {
    if (this.variant() !== 'typewriter') {
      return;
    }
    const name = SAMPLE_NAMES[Math.floor(this.typeTick / 24) % SAMPLE_NAMES.length]!;
    const step = this.typeTick % 24;
    // 0–9 typing, 10–17 waiting, 18–23 deleting.
    const shown =
      step < 10
        ? name.slice(0, Math.ceil((step / 9) * name.length))
        : step < 18
          ? name
          : name.slice(0, Math.max(0, name.length - (step - 17)));
    this.typed.set(shown);
    this.typeTick++;
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
    const name = this.cleanName();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    if (this.variant() === 'confetti') {
      this.bursting.set(true);
      setTimeout(() => this.startGame.emit(name), CONFETTI_MS);
      return;
    }
    this.startGame.emit(name);
  }
}
