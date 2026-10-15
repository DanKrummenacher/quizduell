import {
  Component,
  computed,
  effect,
  inject,
  type OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../../../core/game/error-messages';
import { GAME_SCREEN } from '../../../../core/game/game-screen';
import { GameClient } from '../../../../core/game/game-client.service';
import { IdleResetService } from '../../../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { ResultUiComponent } from '../../components/result-ui/result-ui.component';
import type { PlayerResultView } from '../../result.types';

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

  readonly isFastGame = computed(() => this.game()?.mode === 'quick');
  private readonly opponentName = computed(
    () => this.game()?.opponent?.name ?? 'Dein Gegner',
  );

  /** Ticks every second so the rematch countdown stays current. */
  private readonly now = signal(Date.now());
  private readonly timer = setInterval(() => this.now.set(Date.now()), 1_000);
  /** The "no rematch" notice was confirmed and stays closed. */
  private readonly noticeClosed = signal(false);

  /**
   * Where the rematch stands, from this player's point of view:
   * - `open`: nobody asked yet
   * - `sent` / `received`: one player asked, the other can accept
   * - `paused`: the opponent's connection is interrupted, we wait for them
   * - `left`: the opponent left the result screen
   * - `declined`: the time ran out after a request
   * - `closed`: the time ran out without any request
   */
  readonly rematch = computed<
    'open' | 'sent' | 'received' | 'paused' | 'left' | 'declined' | 'closed'
  >(() => {
    const game = this.game();
    if (!game) {
      return 'closed';
    }
    if (
      game.endReason === 'opponent-left' ||
      game.endReason === 'opponent-disconnected'
    ) {
      return 'left';
    }
    if (game.endReason === 'rematch-declined') {
      return 'declined';
    }
    if (!game.rematchAvailable) {
      const waiting =
        game.phaseEndsAt !== null && game.opponent?.connected === false;
      return waiting ? 'paused' : 'closed';
    }
    if (game.you.rematchRequested) {
      return 'sent';
    }
    return game.opponent?.rematchRequested ? 'received' : 'open';
  });

  /** Seconds left to agree on a rematch, `null` once the window is closed. */
  private readonly secondsLeft = computed(() => {
    this.now();
    const endsAt = this.game()?.phaseEndsAt;
    if (!endsAt) {
      return null;
    }
    return Math.max(0, Math.ceil((endsAt - this.gameClient.serverNow()) / 1_000));
  });

  private readonly rematchOver = computed(() =>
    ['left', 'declined', 'closed'].includes(this.rematch()),
  );

  readonly isPlayAgainDisabled = computed(() =>
    ['sent', 'paused'].includes(this.rematch()),
  );

  readonly playAgainText = computed(() => {
    if (this.rematchOver()) {
      return this.isFastGame() ? 'Neuen Gegner suchen' : 'Neues Spiel erstellen';
    }
    switch (this.rematch()) {
      case 'sent':
        return 'Anfrage gesendet';
      case 'received':
        return 'Revanche annehmen!';
      default:
        return 'Revanche fordern';
    }
  });

  readonly playAgainIcon = computed(() => {
    if (this.rematchOver()) {
      return this.isFastGame() ? 'search' : 'add';
    }
    switch (this.rematch()) {
      case 'sent':
        return 'paper-plane';
      case 'received':
        return 'checkmark-circle';
      default:
        return 'undo';
    }
  });

  readonly playAgainStatusText = computed(() => {
    const name = this.opponentName();
    const seconds = this.secondsLeft();
    const time = seconds !== null ? ` (noch ${seconds} s)` : '';
    switch (this.rematch()) {
      case 'sent':
        return `Warte auf ${name} …${time}`;
      case 'received':
        return `${name} möchte eine Revanche!${time}`;
      case 'paused':
        return `Verbindung zu ${name} unterbrochen – wir warten kurz …`;
      case 'left':
        return `${name} hat das Spiel verlassen.`;
      case 'declined':
        return this.game()?.you.rematchRequested
          ? `${name} hat nicht rechtzeitig reagiert.`
          : 'Die Zeit für die Revanche ist abgelaufen.';
      case 'closed':
        return 'Die Zeit für eine Revanche ist abgelaufen.';
      default:
        return null;
    }
  });

  /** Tells a player who asked for a rematch that it will not happen. */
  readonly showNoRematchFlyout = computed(
    () =>
      !this.noticeClosed() &&
      ['left', 'declined'].includes(this.rematch()) &&
      (this.game()?.you.rematchRequested ?? false),
  );

  readonly noRematchText = computed(() =>
    this.rematch() === 'left'
      ? `${this.opponentName()} hat das Spiel verlassen.`
      : `${this.opponentName()} hat nicht rechtzeitig reagiert.`,
  );

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
            GAME_SCREEN,
          );
        }
        return;
      }
      if (game.phase === 'countdown') {
        // Rematch accepted: the lobby shows "Gegner gefunden" with the countdown.
        void this.router.navigate(['/lobby'], GAME_SCREEN);
      } else if (game.phase === 'question' || game.phase === 'reveal') {
        void this.router.navigate(['/quiz'], GAME_SCREEN);
      }
    });
    this.idleReset.arm();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.idleReset.disarm();
  }

  handleHome(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby'], GAME_SCREEN);
  }

  async handlePlayAgain(): Promise<void> {
    if (this.rematchOver()) {
      // No rematch anymore: start a fresh game of the same kind.
      const restart = this.isFastGame() ? 'fastGameRestart' : 'friendGameRestart';
      this.gameClient.leave();
      void this.router.navigate(['/lobby'], {
        ...GAME_SCREEN,
        state: { [restart]: true },
      });
      return;
    }
    const result = await this.gameClient.requestRematch();
    if (!result.ok) {
      console.warn(errorMessage(result.error));
    }
  }

  handleNoRematchAcknowledge(): void {
    this.noticeClosed.set(true);
  }
}
