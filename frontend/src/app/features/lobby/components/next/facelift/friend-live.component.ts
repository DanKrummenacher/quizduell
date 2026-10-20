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

/**
 * TEMPORARY: variant 7 (card on top, code boxes below, joins by itself)
 * with the motion of the search and «Verbunden!»: a pulse on the box that
 * waits, characters that roll in, a green wave when the code is complete.
 */
@Component({
  selector: 'app-friend-live',
  templateUrl: './friend-live.component.html',
  styleUrl: './friend-live.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendLiveComponent {
  readonly layout = input.required<FriendLayout>();
  readonly playerName = input('');
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
  protected readonly joining = signal(false);
  private readonly serverErrorShown = signal(false);
  protected readonly errorMessage = computed(() =>
    this.serverErrorShown() ? this.joinError() : '',
  );
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
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
    if (this.code().length === GAME_CODE_LENGTH) {
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
