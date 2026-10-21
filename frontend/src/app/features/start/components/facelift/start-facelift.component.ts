import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  inject,
  input,
  type OnInit,
  output,
  signal,
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
  | 'network';

const TITLE = 'Teste dein Wissen im direkten Duell';

/** TEMPORARY (variants): names the empty field types by itself. */
const SAMPLE_NAMES = ['Anna', 'Luca', 'Mia', 'Noah', 'Lea', 'Elias'];
const TYPE_STEP_MS = 110;
/** TEMPORARY (variants): the confetti flies before the lobby opens. */
const CONFETTI_MS = 700;
const COUNT_MS = 1200;

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

  /** TEMPORARY (wordswap): the words that roll through the title. */
  protected readonly swapWords = ['direkten', 'schnellen', 'fairen', 'spannenden'];
  protected readonly swapIndex = signal(0);
  /** TEMPORARY (focus): the name field has the focus. */
  protected readonly formFocused = signal(false);

  /** TEMPORARY (typewriter): the placeholder types sample names. */
  protected readonly typed = signal('');
  protected readonly placeholder = computed(() =>
    this.variant() === 'typewriter' ? `${this.typed()}|` : 'z.B. Max Mustermann',
  );
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
