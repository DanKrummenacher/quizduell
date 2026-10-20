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
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/** TEMPORARY: a fourth round of proposals for «Freund herausfordern». */
@Component({
  selector: 'app-friend-plus',
  imports: [NgTemplateOutlet],
  templateUrl: './friend-plus.component.html',
  styleUrl: './friend-plus.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendPlusComponent {
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
  /** Pasting needs the clipboard API (not in every browser). */
  protected readonly canPaste =
    typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

  protected readonly code = signal('');
  protected readonly focused = signal(false);
  private readonly localError = signal('');
  protected readonly errorMessage = computed(
    () => this.localError() || this.joinError(),
  );
  protected readonly isComplete = computed(
    () => this.code().length === GAME_CODE_LENGTH,
  );
  protected readonly initial = computed(() =>
    this.playerName().trim().charAt(0).toUpperCase(),
  );

  /** The code side or step is shown. */
  protected readonly joinOpen = signal(false);

  constructor() {
    // Each proposal starts fresh in the preview.
    effect(() => {
      this.layout();
      // Only a new layout resets; the field appearing must not.
      untracked(() => {
        this.joinOpen.set(false);
        this.setCode('');
        this.localError.set('');
      });
    });
  }

  protected onCodeInput(event: Event): void {
    this.setCode((event.target as HTMLInputElement).value);
    this.localError.set('');
  }

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
  }

  /** Takes the code from the clipboard, e.g. from a chat message. */
  protected async pasteCode(): Promise<void> {
    try {
      this.setCode(await navigator.clipboard.readText());
      this.localError.set('');
    } catch {
      // No permission: the field gets the focus, so it can be pasted by hand.
    }
    this.field()?.nativeElement.focus();
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
