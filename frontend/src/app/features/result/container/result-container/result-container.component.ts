import {
  Component,
  computed,
  effect,
  inject,
  type OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type {
  GameMode,
  RematchStatus,
} from '../../../../core/contracts/game.contract';
import {
  GAME_SCREEN_NAVIGATION,
  type LobbyStartState,
} from '../../../../core/game/game-screen';
import { GameClient } from '../../../../core/game/game-client.service';
import { IdleResetService } from '../../../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { ResultUiComponent } from '../../components/result-ui/result-ui.component';
import type { PlayerResultView } from '../../result.types';

interface PlayAgainButton {
  label: string;
  icon: string;
  disabled: boolean;
}

/** Button while a rematch is still possible; other states start a new game. */
const REMATCH_BUTTONS: Partial<Record<RematchStatus, PlayAgainButton>> = {
  open: { label: 'Revanche fordern', icon: 'undo', disabled: false },
  requested: { label: 'Anfrage gesendet', icon: 'paper-plane', disabled: true },
  offered: {
    label: 'Revanche annehmen!',
    icon: 'checkmark-circle',
    disabled: false,
  },
  paused: { label: 'Revanche fordern', icon: 'undo', disabled: true },
};

const NEW_GAME_BUTTONS: Record<GameMode, PlayAgainButton> = {
  quick: { label: 'Neuen Gegner suchen', icon: 'search', disabled: false },
  friend: { label: 'Neues Spiel erstellen', icon: 'add', disabled: false },
};

@Component({
  selector: 'app-result-container',
  imports: [ResultUiComponent],
  templateUrl: './result-container.component.html',
})
export class ResultContainerComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly gameClient = inject(GameClient);
  private readonly idleReset = inject(IdleResetService);
  private readonly playerNameStore = inject(PlayerNameStore);

  private readonly game = this.gameClient.state;

  private readonly opponentName = computed(
    () => this.game()?.opponent?.name ?? 'Dein Gegner',
  );
  /** Rematch state as reported by the server. */
  readonly rematch = computed<RematchStatus>(
    () => this.game()?.rematch ?? 'expired',
  );

  /** Ticks every second so the rematch countdown stays current. */
  private readonly now = signal(Date.now());
  private readonly ticker = setInterval(() => this.now.set(Date.now()), 1_000);
  /** The "no rematch" notice was confirmed and stays closed. */
  private readonly noticeClosed = signal(false);

  /** No rematch possible anymore: the button starts a fresh game instead. */
  private readonly rematchOver = computed(() => !REMATCH_BUTTONS[this.rematch()]);

  private readonly secondsLeft = computed(() => {
    this.now();
    const endsAt = this.game()?.phaseEndsAt;
    return endsAt
      ? Math.max(0, Math.ceil((endsAt - this.gameClient.serverNow()) / 1_000))
      : null;
  });

  readonly playAgainButton = computed(
    () =>
      REMATCH_BUTTONS[this.rematch()] ??
      NEW_GAME_BUTTONS[this.game()?.mode ?? 'quick'],
  );

  readonly playAgainHint = computed(() => {
    const name = this.opponentName();
    const seconds = this.secondsLeft();
    const time = seconds !== null ? ` (noch ${seconds} s)` : '';
    switch (this.rematch()) {
      case 'requested':
        return `Warte auf ${name} …${time}`;
      case 'offered':
        return `${name} möchte eine Revanche!${time}`;
      case 'paused':
        return `Verbindung zu ${name} unterbrochen – wir warten kurz …`;
      case 'opponent-left':
        return `${name} hat das Spiel verlassen.`;
      case 'unanswered':
        return `${name} hat nicht rechtzeitig reagiert.`;
      case 'expired':
        return 'Die Zeit für eine Revanche ist abgelaufen.';
      case 'open':
        return null;
    }
  });

  /** Tells a player who asked for a rematch that it will not happen. */
  readonly showNoRematchNotice = computed(() => {
    const status = this.rematch();
    const asked = this.game()?.you.rematchRequested ?? false;
    return (
      !this.noticeClosed() &&
      (status === 'unanswered' || (status === 'opponent-left' && asked))
    );
  });

  readonly rawPlayers = computed(() => {
    const game = this.game();
    if (!game) {
      return [];
    }
    const players = [{ name: game.you.name, score: game.you.score, isMe: true }];
    if (game.opponent) {
      players.push({
        name: game.opponent.name,
        score: game.opponent.score,
        isMe: false,
      });
    }
    return players;
  });

  readonly gameResult = computed(() => {
    const players = this.rawPlayers();
    const me = players.find((p) => p.isMe);
    const opponent = players.find((p) => !p.isMe);
    if (!me || !opponent || me.score === opponent.score) {
      return 'DRAW';
    }
    return me.score > opponent.score ? 'WIN' : 'LOSS';
  });

  readonly playersView = computed<PlayerResultView[]>(() => {
    const sorted = [...this.rawPlayers()].sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.isMe ? -1 : 1,
    );
    const result = this.gameResult();
    return sorted.map((p) => {
      let cardState: PlayerResultView['cardState'] = 'default';
      if (p.isMe && result === 'WIN') {
        cardState = 'win';
      } else if (p.isMe && result === 'LOSS') {
        cardState = 'loss';
      }
      return { name: p.name, score: p.score, cardState, isMe: p.isMe };
    });
  });

  readonly statusTitle = computed(() => {
    if (this.gameResult() === 'WIN') {
      return 'Gewonnen!';
    }
    return this.gameResult() === 'LOSS' ? 'Verloren!' : 'Unentschieden!';
  });

  readonly statusSubtitle = computed(() => {
    if (this.gameResult() === 'WIN') {
      return 'Du hast deinen Gegner geschlagen';
    }
    return this.gameResult() === 'LOSS'
      ? 'Kopf hoch, die nächste Runde gehört dir'
      : 'Ihr wart exakt gleich gut';
  });

  readonly statusIcon = computed(() => {
    if (this.gameResult() === 'WIN') {
      return 'trophy';
    }
    return this.gameResult() === 'LOSS' ? 'lightning-strike' : 'handshake';
  });

  constructor() {
    effect(() => {
      const game = this.game();
      if (!game) {
        if (!this.gameClient.resuming()) {
          void this.router.navigate(
            [this.playerNameStore.name() ? '/lobby' : '/'],
            GAME_SCREEN_NAVIGATION,
          );
        }
        return;
      }
      if (game.phase === 'countdown') {
        // Rematch accepted: the lobby shows "Gegner gefunden" with the countdown.
        void this.router.navigate(['/lobby'], GAME_SCREEN_NAVIGATION);
      } else if (game.phase === 'question' || game.phase === 'reveal') {
        void this.router.navigate(['/quiz'], GAME_SCREEN_NAVIGATION);
      }
    });
    this.idleReset.arm();
  }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
    this.idleReset.disarm();
  }

  handleHome(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby'], GAME_SCREEN_NAVIGATION);
  }

  async handlePlayAgain(): Promise<void> {
    if (this.rematchOver()) {
      // Start a fresh game of the same kind.
      const state: LobbyStartState = {
        autoStart: this.game()?.mode ?? 'quick',
      };
      this.gameClient.leave();
      void this.router.navigate(['/lobby'], { ...GAME_SCREEN_NAVIGATION, state });
      return;
    }
    // If the request fails (e.g. the opponent just left), the next game state
    // already shows why.
    await this.gameClient.requestRematch();
  }

  handleNoRematchAcknowledge(): void {
    this.noticeClosed.set(true);
  }
}
