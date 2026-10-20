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
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/** TEMPORARY: a fifth round of proposals for «Freund herausfordern». */
@Component({
  selector: 'app-friend-five',
  imports: [NgTemplateOutlet],
  templateUrl: './friend-five.component.html',
  styleUrl: './friend-five.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendFiveComponent {
  readonly layout = input.required<FriendLayout>();
  readonly playerName = input('');
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
  protected readonly errorMessage = computed(
    () => this.localError() || this.joinError(),
  );
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
  );

  /** The code entry is open. */
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
      this.localError.set(`Der Code muss genau ${GAME_CODE_LENGTH} Zeichen haben.`);
      return;
    }
    this.joinGame.emit(code);
  }
}
