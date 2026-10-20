import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/**
 * TEMPORARY: friend proposals made only of design system parts (library
 * input and buttons, the cards of the mode screen), after proven games:
 * Jackbox (a form for a 4 character room code) and Kahoot (a game PIN).
 */
@Component({
  selector: 'app-friend-lib',
  templateUrl: './friend-lib.component.html',
  styleUrl: './friend-lib.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendLibComponent {
  readonly layout = input.required<FriendLayout>();
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  protected readonly codeLength = GAME_CODE_LENGTH;
  private readonly code = signal('');
  private readonly localError = signal('');
  protected readonly errorMessage = computed(
    () => this.localError() || this.joinError(),
  );

  /** «Zwei Schritte»: the code has its own step. */
  protected readonly joinOpen = signal(false);

  constructor() {
    // Only a new layout resets the preview.
    effect(() => {
      this.layout();
      untracked(() => {
        this.joinOpen.set(false);
        this.code.set('');
        this.localError.set('');
      });
    });
  }

  /** Keeps only characters that can appear in a game code. */
  protected onCodeInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = Array.from((field.value || '').toUpperCase())
      .filter((char) => GAME_CODE_ALPHABET.includes(char))
      .join('')
      .slice(0, GAME_CODE_LENGTH);
    field.value = value;
    this.code.set(value);
    this.localError.set('');
  }

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
  }

  protected submitJoin(): void {
    const code = this.code();
    if (!code) {
      this.localError.set('Bitte Code eingeben.');
      return;
    }
    if (code.length !== GAME_CODE_LENGTH) {
      this.localError.set(`Der Code hat ${GAME_CODE_LENGTH} Zeichen.`);
      return;
    }
    this.joinGame.emit(code);
  }
}
