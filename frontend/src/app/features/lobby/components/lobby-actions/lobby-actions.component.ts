import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-button';
import '@css-ch/calc-ui-input-text';

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

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value || '';

    value = value.toUpperCase().substring(0, 4);
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

    if (trimmed.length !== 4) {
      this.localError = 'Der Code muss genau 4 Zeichen haben.';
      return;
    }

    this.joinGame.emit(trimmed);
  }
}
