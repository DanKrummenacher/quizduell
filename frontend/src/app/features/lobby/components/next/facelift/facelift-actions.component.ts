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
} from '../../../../../core/contracts/game.contract';
import {
  FRIEND_EXTRA,
  FRIEND_MORE,
  FRIEND_LIVE,
  FRIEND_M1,
  FRIEND_OR,
  type FriendLayout,
} from '../lobby-design';
import { FriendExtraComponent } from './friend-extra.component';
import { FriendLiveComponent } from './friend-live.component';
import { FriendM1Component } from './friend-m1.component';
import { FriendOrComponent } from './friend-or.component';
import { FriendIdeasComponent } from './friend-ideas.component';
import { FriendMoreComponent } from './friend-more.component';

@Component({
  selector: 'app-facelift-actions',
  imports: [
    FriendIdeasComponent,
    FriendMoreComponent,
    FriendExtraComponent,
    FriendLiveComponent,
    FriendM1Component,
    FriendOrComponent,
  ],
  templateUrl: './facelift-actions.component.html',
  styleUrl: './facelift-actions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftActionsComponent {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<FriendLayout>('facelift');
  readonly playerName = input('');
  protected readonly isM1 = computed(() => FRIEND_M1.includes(this.layout()));
  protected readonly isOr = computed(() => FRIEND_OR.includes(this.layout()));
  protected readonly isLive = computed(() => FRIEND_LIVE.includes(this.layout()));
  protected readonly isExtra = computed(() => FRIEND_EXTRA.includes(this.layout()));
  readonly joinError = input<string>('');
  protected readonly isMore = computed(() => FRIEND_MORE.includes(this.layout()));
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
