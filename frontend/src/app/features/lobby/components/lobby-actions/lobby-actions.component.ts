import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../core/contracts/game.contract';
import '@css-ch/components/icon';
import '@css-ch/components/button';
import '@css-ch/components/input-text';

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

  private inputCode = '';
  localError = '';

  get errorMessage(): string {
    return this.localError || this.joinError();
  }

  onCodeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value || '';

    value = Array.from(value.toUpperCase())
      .filter((char) => GAME_CODE_ALPHABET.includes(char))
      .join('')
      .substring(0, GAME_CODE_LENGTH);
    input.value = value;

    this.inputCode = value;
    this.localError = '';
  }

  submitJoin() {
    const trimmed = this.inputCode.trim();
    if (!trimmed) {
      this.localError = 'Bitte Code eingeben.';
      return;
    }

    if (trimmed.length !== GAME_CODE_LENGTH) {
      this.localError = 'Der Code muss genau 4 Zeichen haben.';
      return;
    }

    this.joinGame.emit(trimmed);
  }
}
