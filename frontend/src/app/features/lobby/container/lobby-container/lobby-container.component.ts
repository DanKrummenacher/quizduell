import {
  Component,
  computed,
  effect,
  inject,
  isDevMode,
  type OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../../../core/game/error-messages';
import {
  GAME_SCREEN_NAVIGATION,
  type LobbyStartState,
} from '../../../../core/game/game-screen';
import { GameClient } from '../../../../core/game/game-client.service';
import { IdleResetService } from '../../../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { LobbyUiComponent } from '../../components/lobby-ui/lobby-ui.component';
import { LobbyDesignPanelComponent } from '../../components/next/design-preview-panel.component';
import type { LobbyDesign, MatchLayout } from '../../components/next/lobby-design';
import type { LobbyState } from '../../lobby.types';

@Component({
  selector: 'app-lobby-container',
  imports: [LobbyUiComponent, LobbyDesignPanelComponent],
  templateUrl: './lobby-container.component.html',
})
export class LobbyContainerComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly gameClient = inject(GameClient);
  private readonly idleReset = inject(IdleResetService);

  readonly playerName = inject(PlayerNameStore).name;
  readonly menuState = signal<'CHOOSE_MODE' | 'CHOOSE_ACTION'>('CHOOSE_MODE');
  readonly joinError = signal('');
  readonly notice = signal<string | null>(null);

  private readonly game = this.gameClient.state;

  // TEMPORARY: compare the lobby of today with the facelift
  // (development builds only).
  readonly showDesignPreview = isDevMode();
  readonly design = signal<LobbyDesign>('facelift');
  readonly previewScreen = signal<LobbyState | null>(null);
  readonly matchLayout = signal<MatchLayout>('facelift');

  readonly lobbyState = computed<LobbyState>(
    () => this.previewScreen() ?? this.realLobbyState(),
  );

  private readonly realLobbyState = computed<LobbyState>(() => {
    const phase = this.game()?.phase;
    if (phase === 'waiting') {
      return 'WAITING';
    }
    if (phase === 'countdown') {
      return 'FOUND';
    }
    if (this.gameClient.searching()) {
      return 'SEARCHING';
    }
    return this.menuState();
  });

  readonly roomCode = computed(
    () => this.game()?.gameCode ?? (this.previewScreen() ? 'S6Q2' : ''),
  );
  readonly opponentName = computed(
    () =>
      this.game()?.opponent?.name ?? (this.previewScreen() ? 'Max Mustermann' : ''),
  );
  readonly countdownMs = computed(() => this.game()?.phaseDurationMs ?? 3000);
  readonly opponentLeft = computed(() => this.game()?.phase === 'aborted');

  constructor() {
    // "Neuen Gegner suchen" / "Neues Spiel erstellen" on the result screen.
    const { autoStart } = (history.state ?? {}) as LobbyStartState;
    if (autoStart) {
      // Only once: a reload of the lobby must not start another game.
      history.replaceState({ ...history.state, autoStart: undefined }, '');
      if (autoStart === 'quick') {
        void this.handleSelectQuickGame();
      } else {
        this.menuState.set('CHOOSE_ACTION');
        void this.handleCreate();
      }
    }

    effect(() => {
      const phase = this.game()?.phase;
      if (phase === 'question' || phase === 'reveal') {
        void this.router.navigate(['/quiz'], GAME_SCREEN_NAVIGATION);
      } else if (phase === 'finished') {
        void this.router.navigate(['/result'], GAME_SCREEN_NAVIGATION);
      }
    });

    // Stand mode: only reset while nobody is searching or waiting for an opponent.
    effect(() => {
      const state = this.lobbyState();
      untracked(() => {
        if (state === 'CHOOSE_MODE' || state === 'CHOOSE_ACTION') {
          this.idleReset.arm();
        } else {
          this.idleReset.disarm();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.idleReset.disarm();
  }

  handleBack(): void {
    const state = this.lobbyState();
    if (state === 'WAITING' || state === 'FOUND') {
      this.gameClient.leave();
      this.menuState.set('CHOOSE_ACTION');
    } else if (state === 'SEARCHING') {
      void this.gameClient.cancelMatchmaking();
      this.menuState.set('CHOOSE_MODE');
    } else if (state === 'CHOOSE_ACTION') {
      this.joinError.set('');
      this.menuState.set('CHOOSE_MODE');
    } else {
      void this.router.navigate(['/']);
    }
  }

  async handleSelectQuickGame(): Promise<void> {
    const result = await this.gameClient.startMatchmaking(this.playerName());
    if (!result.ok) {
      this.notice.set(errorMessage(result.error));
    }
  }

  handleCancelSearch(): void {
    void this.gameClient.cancelMatchmaking();
    this.menuState.set('CHOOSE_MODE');
  }

  handleSelectFriendGame(): void {
    this.menuState.set('CHOOSE_ACTION');
  }

  async handleCreate(): Promise<void> {
    const result = await this.gameClient.createGame(this.playerName());
    if (!result.ok) {
      this.notice.set(errorMessage(result.error));
    }
  }

  async handleJoin(code: string): Promise<void> {
    this.joinError.set('');
    const result = await this.gameClient.joinGame(code, this.playerName());
    if (!result.ok) {
      this.joinError.set(errorMessage(result.error));
    }
  }

  handleOpponentLeftAcknowledge(): void {
    this.gameClient.leave();
    this.menuState.set('CHOOSE_MODE');
  }

  handleNoticeAcknowledge(): void {
    this.notice.set(null);
  }
}
