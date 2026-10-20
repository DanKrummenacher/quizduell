import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/** TEMPORARY: further proposals for the «Freund herausfordern» screen. */
@Component({
  selector: 'app-friend-more',
  imports: [NgTemplateOutlet],
  templateUrl: './friend-more.component.html',
  styleUrl: './friend-more.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendMoreComponent {
  readonly layout = input.required<FriendLayout>();
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  protected readonly codeLength = GAME_CODE_LENGTH;
  protected readonly slots = Array.from(
    { length: GAME_CODE_LENGTH },
    (_, index) => index,
  );

  protected readonly code = signal('');
  protected readonly focused = signal(false);
  private readonly localError = signal('');
  /** «Automatisch»: set while the full code is being checked. */
  protected readonly joining = signal(false);
  protected readonly errorMessage = computed(
    () => this.localError() || this.joinError(),
  );

  /** «Zwei Schritte» and «Blatt»: the code entry is open. */
  protected readonly joinOpen = signal(false);

  constructor() {
    // Each proposal starts fresh in the preview.
    effect(() => {
      this.layout();
      this.joinOpen.set(false);
      this.code.set('');
      this.localError.set('');
      this.joining.set(false);
    });
    // A new error from the server ends the check.
    effect(() => {
      if (this.joinError()) {
        this.joining.set(false);
      }
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
    // «Automatisch»: the fourth character joins right away.
    if (this.layout() === 'fr-auto' && value.length === GAME_CODE_LENGTH) {
      this.submitJoin();
    }
  }

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
    if (event.key === 'Escape') {
      this.joinOpen.set(false);
    }
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
    this.joining.set(true);
    this.joinGame.emit(code);
  }
}
