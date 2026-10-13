import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  type OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/components/notification';
import '@css-ch/components/spinner';
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
} from '../../core/contracts/game.contract';
import { errorMessage } from '../../core/game/error-messages';
import { GameClient } from '../../core/game/game-client.service';
import { JoinIntentStore } from '../../core/game/join-intent.store';
import { IdleResetService } from '../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../core/player/player-name.store';
import { ChoiceCardComponent } from '../../core/ui/choice-card/choice-card.component';
import { ConnectionBannerComponent } from '../../core/ui/connection-banner/connection-banner.component';
import { PageComponent } from '../../core/ui/page/page.component';

type LobbyView = 'menu' | 'friend' | 'searching';

@Component({
  selector: 'app-lobby-page',
  imports: [PageComponent, ChoiceCardComponent, ConnectionBannerComponent],
  templateUrl: './lobby.page.html',
  styleUrl: './lobby.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyPage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly gameClient = inject(GameClient);
  private readonly idleReset = inject(IdleResetService);
  protected readonly playerName = inject(PlayerNameStore).name;

  protected readonly view = signal<LobbyView>('menu');
  protected readonly busy = signal<'quick' | 'create' | 'join' | null>(null);
  protected readonly error = signal('');
  protected readonly code = signal('');
  protected readonly codeError = signal('');
  protected readonly codeLength = GAME_CODE_LENGTH;

  constructor() {
    // Invitation link: jump straight into joining the shared game.
    const invitedCode = inject(JoinIntentStore).take();
    if (invitedCode) {
      this.view.set('friend');
      this.code.set(invitedCode);
      void this.joinGame();
    } else if (
      (history.state as { autoStart?: string } | null)?.autoStart === 'quick'
    ) {
      // "Neues Duell" from the result screen.
      void this.startQuickGame();
    }

    // Entering a game (created, joined or matched) switches to the game screen.
    effect(() => {
      if (this.gameClient.state()) {
        void this.router.navigate(['/spiel']);
      }
    });

    // The stand-mode reset must never interrupt a running search.
    effect(() => {
      if (this.view() === 'searching') {
        this.idleReset.disarm();
      } else {
        this.idleReset.arm();
      }
    });

    effect(() => {
      if (
        this.view() === 'searching' &&
        !this.gameClient.searching() &&
        !this.busy()
      ) {
        this.view.set('menu');
      }
    });
  }

  ngOnDestroy(): void {
    this.idleReset.disarm();
  }

  protected back(): void {
    if (this.view() === 'menu') {
      void this.router.navigate(['/']);
    } else {
      this.cancelSearch();
      this.view.set('menu');
      this.error.set('');
    }
  }

  protected async startQuickGame(): Promise<void> {
    this.error.set('');
    this.view.set('searching');
    this.busy.set('quick');
    const result = await this.gameClient.startMatchmaking(this.playerName());
    this.busy.set(null);
    if (!result.ok) {
      this.view.set('menu');
      this.error.set(errorMessage(result.error));
    }
  }

  protected cancelSearch(): void {
    if (this.view() === 'searching') {
      void this.gameClient.cancelMatchmaking();
      this.view.set('menu');
    }
  }

  protected openFriendMenu(): void {
    this.error.set('');
    this.view.set('friend');
  }

  protected async createGame(): Promise<void> {
    this.error.set('');
    this.busy.set('create');
    const result = await this.gameClient.createGame(this.playerName());
    this.busy.set(null);
    if (!result.ok) {
      this.error.set(errorMessage(result.error));
    }
  }

  protected onCodeChange(event: Event): void {
    const raw = ((event as CustomEvent<string>).detail ?? '').toUpperCase();
    const cleaned = Array.from(raw)
      .filter((char) => GAME_CODE_ALPHABET.includes(char))
      .join('')
      .slice(0, GAME_CODE_LENGTH);
    this.code.set(cleaned);
    this.codeError.set('');
  }

  protected onCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.joinGame();
    } else if (
      (history.state as { autoStart?: string } | null)?.autoStart === 'quick'
    ) {
      // "Neues Duell" from the result screen.
      void this.startQuickGame();
    }
  }

  protected async joinGame(): Promise<void> {
    const code = this.code();
    if (code.length !== GAME_CODE_LENGTH) {
      this.codeError.set(`Der Code hat ${GAME_CODE_LENGTH} Zeichen.`);
      return;
    }
    this.busy.set('join');
    const result = await this.gameClient.joinGame(code, this.playerName());
    this.busy.set(null);
    if (!result.ok) {
      this.codeError.set(errorMessage(result.error));
    }
  }
}
