import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../core/contracts/game.contract';

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

  protected readonly codeLength = GAME_CODE_LENGTH;
  private readonly code = signal('');
  private readonly localError = signal('');
  protected readonly errorMessage = computed(
    () => this.localError() || this.joinError(),
  );

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
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

  protected submitJoin(): void {
    const code = this.code();
    if (!code) {
      this.localError.set('Bitte Code eingeben.');
      return;
    }
    if (code.length !== GAME_CODE_LENGTH) {
      this.localError.set(`Der Code muss genau ${GAME_CODE_LENGTH} Zeichen haben.`);
      return;
    }
    this.joinGame.emit(code);
  }
}
