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
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/**
 * TEMPORARY: friend proposals that build on the rest of the app: the cards
 * of the mode screen, the ring of the search, the input of the library.
 * All of them join by themselves after the fourth character.
 */
@Component({
  selector: 'app-friend-iris',
  imports: [NgTemplateOutlet],
  templateUrl: './friend-iris.component.html',
  styleUrl: './friend-iris.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendIrisComponent {
  readonly layout = input.required<FriendLayout>();
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('codeField');

  protected readonly codeLength = GAME_CODE_LENGTH;
  protected readonly slots = Array.from(
    { length: GAME_CODE_LENGTH },
    (_, index) => index,
  );
  /** The ring of the search: 60 ticks, a quarter per character. */
  protected readonly ticks = Array.from({ length: 60 }, (_, index) => index * 6);

  protected readonly code = signal('');
  protected readonly focused = signal(false);
  protected readonly joining = signal(false);
  private readonly serverErrorShown = signal(false);
  protected readonly errorMessage = computed(() =>
    this.serverErrorShown() ? this.joinError() : '',
  );
  protected readonly isEmpty = computed(() => this.code().length === 0);
  protected readonly filledTicks = computed(
    () => (this.code().length / GAME_CODE_LENGTH) * 60,
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
    this.setCode(
      (event.target as HTMLInputElement).value,
      event.target as HTMLInputElement,
    );
    this.serverErrorShown.set(false);
    if (this.code().length === GAME_CODE_LENGTH) {
      this.joining.set(true);
      this.joinGame.emit(this.code());
    }
  }

  /** Keeps only characters that can appear in a game code. */
  private setCode(raw: string, target?: { value: string }): void {
    const value = Array.from((raw || '').toUpperCase())
      .filter((char) => GAME_CODE_ALPHABET.includes(char))
      .join('')
      .slice(0, GAME_CODE_LENGTH);
    this.code.set(value);
    const element = target ?? this.field()?.nativeElement;
    if (element && element.value !== value) {
      element.value = value;
    }
  }
}
