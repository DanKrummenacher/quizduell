import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';
import type { StartLayout } from './start-design';

/** K8: the words of the split-flap board, six cells each. */
const FLAP_WORDS = ['QUIZ', 'DUELL', 'WISSEN', 'TEMPO'];
const FLAP_CELLS = 6;
const FLAP_INTERVAL_MS = 2800;

interface FlapCell {
  key: string;
  char: string;
}

/**
 * TEMPORARY (round 4): start page concepts. Same data and behaviour as
 * today: a name, then off to the lobby.
 */
@Component({
  selector: 'app-start-round-d',
  imports: [BrandHeaderComponent, LogoMarkComponent, NgTemplateOutlet],
  templateUrl: './start-round-d.component.html',
  styleUrl: './start-round-d.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class StartRoundDComponent implements OnInit {
  readonly layout = input.required<StartLayout>();
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');

  protected readonly cleanName = computed(() =>
    this.playerName().replace(/\s+/g, ' ').trim(),
  );
  protected readonly initial = computed(() =>
    this.cleanName().charAt(0).toUpperCase(),
  );

  /** K8: the board shows one word after the other. */
  private readonly wordIndex = signal(0);
  protected readonly flapCells = computed<FlapCell[]>(() => {
    const index = this.wordIndex();
    const word = FLAP_WORDS[index % FLAP_WORDS.length]!;
    const padded = word
      .padStart(Math.floor((FLAP_CELLS + word.length) / 2))
      .padEnd(FLAP_CELLS);
    // A new key per word: the cells are new elements and flip in.
    return Array.from(padded, (char, cell) => ({ key: `${index}-${cell}`, char }));
  });

  /** K11: the pass leans towards the pointer. */
  protected readonly tiltX = signal(0);
  protected readonly tiltY = signal(0);

  constructor() {
    const timer = setInterval(
      () => this.wordIndex.update((value) => value + 1),
      FLAP_INTERVAL_MS,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.playerName.set(this.initialName());
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    this.tiltX.set(Math.round(-y * 16));
    this.tiltY.set(Math.round(x * 20));
  }

  protected onPointerLeave(): void {
    this.tiltX.set(0);
    this.tiltY.set(0);
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
    this.startGame.emit(name);
  }
}
