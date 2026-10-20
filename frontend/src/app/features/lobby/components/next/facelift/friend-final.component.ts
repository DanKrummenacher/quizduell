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

type Tab = 'create' | 'join';

/**
 * TEMPORARY: final proposals from the favourites 3 (switch), 7 (joins by
 * itself after the fourth character) and 12 (code first).
 */
@Component({
  selector: 'app-friend-final',
  imports: [NgTemplateOutlet],
  templateUrl: './friend-final.component.html',
  styleUrl: './friend-final.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class FriendFinalComponent {
  readonly layout = input.required<FriendLayout>();
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
  /** Set while a complete code is being checked by the server. */
  protected readonly joining = signal(false);
  private readonly localError = signal('');
  /** The server's answer shows until the code is changed. */
  private readonly serverErrorShown = signal(false);
  protected readonly errorMessage = computed(
    () => this.localError() || (this.serverErrorShown() ? this.joinError() : ''),
  );
  protected readonly isEmpty = computed(() => this.code().length === 0);

  /** The switch of «3»: which way is shown. */
  protected readonly tab = signal<Tab>('create');

  constructor() {
    // Only a new layout resets the preview.
    effect(() => {
      const layout = this.layout();
      untracked(() => {
        this.tab.set(layout === 'g-switch-join' ? 'join' : 'create');
        this.setCode('');
        this.joining.set(false);
        this.localError.set('');
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

  protected showTab(tab: Tab): void {
    this.tab.set(tab);
    this.localError.set('');
  }

  protected onCodeInput(event: Event): void {
    this.setCode((event.target as HTMLInputElement).value);
    this.localError.set('');
    this.serverErrorShown.set(false);
    // As in «7»: the fourth character joins by itself.
    if (this.code().length === GAME_CODE_LENGTH) {
      this.submitJoin();
    }
  }

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitJoin();
    }
  }

  protected submitJoin(): void {
    if (this.joining()) {
      return;
    }
    const code = this.code();
    if (code.length !== GAME_CODE_LENGTH) {
      this.localError.set(`Der Code hat ${GAME_CODE_LENGTH} Zeichen.`);
      return;
    }
    this.joining.set(true);
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
