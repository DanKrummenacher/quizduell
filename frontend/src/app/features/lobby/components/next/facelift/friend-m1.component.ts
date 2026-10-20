import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  type ElementRef,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import '@css-ch/components/icon';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/** The words and the spacing of one final proposal. */
interface Copy {
  title: string;
  /** The line under the title; none if empty. */
  text: string;
  /** The line under the boxes while nothing happens; none if empty. */
  hint: string;
  /** More room between the parts, for calm. */
  airy?: boolean;
}

const QUIET: Copy = {
  title: 'Code eingeben',
  text: 'Den Code hat dir dein Freund geschickt',
  hint: '',
};

const COPIES: Partial<Record<FriendLayout, Copy>> = {
  'o-quiet': QUIET,
  'o-merged': {
    title: 'Code eingeben',
    text: 'Nach dem 4. Zeichen geht es automatisch los',
    hint: '',
  },
  'o-short': {
    title: 'Code eingeben',
    text: '',
    hint: 'Startet automatisch nach dem 4. Zeichen',
  },
  'o-airy': {
    title: 'Code eingeben',
    text: 'Den Code hat dir dein Freund geschickt',
    hint: '',
    airy: true,
  },
  'o-question': {
    title: 'Hast du einen Code?',
    text: 'Gib ihn ein, es geht automatisch los',
    hint: '',
  },
};

/**
 * TEMPORARY: final proposals for M1. Same structure (card, «oder», title,
 * code); they differ in the words and the spacing only.
 */
@Component({
  selector: 'app-friend-m1',
  templateUrl: './friend-m1.component.html',
  styleUrl: './friend-m1.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()', '[class.is-airy]': 'copy().airy' },
})
export class FriendM1Component {
  readonly layout = input.required<FriendLayout>();
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('codeField');

  protected readonly copy = computed<Copy>(() => COPIES[this.layout()] ?? QUIET);

  protected readonly codeLength = GAME_CODE_LENGTH;
  protected readonly slots = Array.from(
    { length: GAME_CODE_LENGTH },
    (_, index) => index,
  );

  protected readonly code = signal('');
  protected readonly focused = signal(false);
  protected readonly joining = signal(false);
  private readonly serverErrorShown = signal(false);
  protected readonly errorMessage = computed(() =>
    this.serverErrorShown() ? this.joinError() : '',
  );

  constructor() {
    // Only a new layout resets the preview.
    effect(() => {
      this.layout();
      untracked(() => {
        this.setCode('');
        this.joining.set(false);
        this.serverErrorShown.set(false);
      });
    });
    // An answer from the server ends the check; the code is selected, so
    // typing replaces it right away.
    effect(() => {
      if (this.joinError()) {
        untracked(() => {
          if (this.joining()) {
            this.joining.set(false);
            this.serverErrorShown.set(true);
            this.field()?.nativeElement.select();
          }
        });
      }
    });
  }

  protected onCodeInput(event: Event): void {
    this.setCode((event.target as HTMLInputElement).value);
    this.serverErrorShown.set(false);
    // The fourth character joins by itself.
    if (this.code().length === GAME_CODE_LENGTH && !this.joining()) {
      this.joining.set(true);
      this.joinGame.emit(this.code());
    }
  }

  /** Keeps only characters that can appear in a game code. */
  private setCode(raw: string): void {
    const value = Array.from((raw || '').toUpperCase())
      .filter((char) => GAME_CODE_ALPHABET.includes(char))
      .join('')
      .slice(0, GAME_CODE_LENGTH);
    this.code.set(value);
    const element = this.field()?.nativeElement;
    if (element && element.value !== value) {
      element.value = value;
    }
  }
}
