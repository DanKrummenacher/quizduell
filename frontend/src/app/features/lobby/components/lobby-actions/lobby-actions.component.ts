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
} from '../../../../core/contracts/game.contract';

/**
 * Playing with a friend: create a game, or join with the four character
 * code of the friend. The fourth character joins by itself.
 */
@Component({
  selector: 'app-lobby-actions',
  templateUrl: './lobby-actions.component.html',
  styleUrl: './lobby-actions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyActionsComponent {
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('codeField');

  protected readonly codeLength = GAME_CODE_LENGTH;
  protected readonly slots = Array.from(
    { length: GAME_CODE_LENGTH },
    (_, index) => index,
  );

  protected readonly code = signal('');
  protected readonly focused = signal(false);
  /** Set while a complete code is being checked by the server. */
  protected readonly joining = signal(false);
  /** The server's answer shows until the code is changed. */
  private readonly serverErrorShown = signal(false);
  protected readonly errorMessage = computed(() =>
    this.serverErrorShown() ? this.joinError() : '',
  );

  constructor() {
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
