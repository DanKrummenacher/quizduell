import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../core/contracts/game.contract';

/** Code field with the join button. */
@Component({
  selector: 'app-join-form',
  template: `
    <div class="join-row">
      <css-input-text
        id="roomCode"
        [label]="label()"
        placeholder="z.B. 05CA"
        class="code-input"
        uppercase
        [maxlength]="codeLength"
        autocomplete="off"
        [errorMessage]="errorMessage() || undefined"
        (input)="onCodeInput($event)"
        (keydown)="onCodeKeydown($event)"
      >
      </css-input-text>
      <css-button
        variant="primary"
        ariaLabel="Beitreten"
        class="join-button"
        (click)="submitJoin()"
      >
        <css-icon icon="arrow-right-circle" slot="prefix"></css-icon>
      </css-button>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-helpers/styles' as functions;

    :host {
      display: block;
    }

    .join-row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: start;
      gap: functions.rem(12);
    }

    .code-input {
      display: block;
      width: 100%;
    }

    // Aligned with the field below its label.
    .join-button {
      display: block;
      width: functions.rem(76);
      margin-top: functions.rem(21);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class JoinFormComponent {
  readonly label = input('Code');
  readonly joinError = input<string>('');
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
