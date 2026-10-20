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
import '@css-ch/components/button';
import '@css-ch/components/icon';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../../../../core/contracts/game.contract';
import type { FriendLayout } from '../lobby-design';

/** How one proposal puts the parts together. */
interface Look {
  /** The separator: a line with «oder», a round badge, or none. */
  separator: 'line' | 'badge' | 'none';
  /** The heading of the code: centred, left, with icon, or a small label. */
  heading: 'center' | 'left' | 'icon' | 'eyebrow';
  /** The code inside a white card. */
  card?: boolean;
  /** You and the open seat instead of the plus. */
  duel?: boolean;
  /** One segment per character under the boxes. */
  progress?: boolean;
  /** «Code einfügen» from the clipboard. */
  paste?: boolean;
}

const LOOKS: Partial<Record<FriendLayout, Look>> = {
  'm-center': { separator: 'line', heading: 'center' },
  'm-badge': { separator: 'badge', heading: 'center' },
  'm-left': { separator: 'line', heading: 'left' },
  'm-icon': { separator: 'line', heading: 'icon' },
  'm-eyebrow': { separator: 'none', heading: 'eyebrow' },
  'm-card': { separator: 'badge', heading: 'center', card: true },
  'm-paste': { separator: 'line', heading: 'center', paste: true },
  'm-duel': { separator: 'line', heading: 'center', duel: true },
  'm-progress': { separator: 'badge', heading: 'center', progress: true },
};

/**
 * TEMPORARY: many refinements of L1 (variant 7 with motion): «oder» on its
 * own, then a clear heading «Code eingeben», then the boxes.
 */
@Component({
  selector: 'app-friend-or',
  templateUrl: './friend-or.component.html',
  styleUrl: './friend-or.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendOrComponent {
  readonly layout = input.required<FriendLayout>();
  readonly playerName = input('');
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('codeField');

  protected readonly look = computed<Look>(
    () => LOOKS[this.layout()] ?? { separator: 'line', heading: 'center' },
  );

  protected readonly codeLength = GAME_CODE_LENGTH;
  protected readonly slots = Array.from(
    { length: GAME_CODE_LENGTH },
    (_, index) => index,
  );
  protected readonly canPaste =
    typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

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
    this.joinIfComplete();
  }

  /** Takes the code from the clipboard, e.g. from a chat message. */
  protected async pasteCode(): Promise<void> {
    try {
      this.setCode(await navigator.clipboard.readText());
      this.serverErrorShown.set(false);
      this.joinIfComplete();
    } catch {
      // No permission: the field gets the focus, so it can be pasted by hand.
    }
    this.field()?.nativeElement.focus();
  }

  /** The fourth character joins by itself. */
  private joinIfComplete(): void {
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
