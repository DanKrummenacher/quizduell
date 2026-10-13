import { Component, computed, effect, inject, type OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../../../core/game/error-messages';
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
  readonly isRematchRequested = computed(
    () => this.game()?.you.rematchRequested ?? false,
  );
  readonly opponentRequestedRematch = computed(
    () => this.game()?.opponent?.rematchRequested ?? false,
  );
  readonly isOpponentLeft = computed(() => {
    const reason = this.game()?.endReason;
    return reason === 'opponent-left' || reason === 'opponent-disconnected';
  });
  /** The rematch window has closed without both players agreeing. */
  readonly isSessionExpired = computed(() => {
    const game = this.game();
    return !!game && !this.isOpponentLeft() && !game.rematchAvailable;
  });

  readonly isPlayAgainDisabled = computed(() => {
    if (this.isFastGame()) {
      return false;
    }
    return (
      this.isRematchRequested() || this.isOpponentLeft() || this.isSessionExpired()
    );
  });

  readonly playAgainText = computed(() => {
    if (this.isFastGame() || this.isSessionExpired() || this.isOpponentLeft()) {
      return 'Erneut Spielen';
    }
    if (this.isRematchRequested()) {
      return 'Anfrage gesendet';
    }
    if (this.opponentRequestedRematch()) {
      return 'Revanche annehmen!';
    }
    return 'Erneut Spielen';
  });

  readonly playAgainIcon = computed(() => {
    if (this.isFastGame() || this.isSessionExpired() || this.isOpponentLeft()) {
      return 'undo';
    }
    if (this.isRematchRequested()) {
      return 'paper-plane';
    }
    return this.opponentRequestedRematch() ? 'checkmark-circle' : 'undo';
  });

  readonly playAgainStatusText = computed(() => {
    if (this.isFastGame()) {
      return null;
    }
    if (this.isOpponentLeft()) {
      return 'Dein Gegner hat das Spiel verlassen!';
    }
    if (this.isSessionExpired()) {
      return 'Die Spielsitzung wurde beendet.';
    }
    if (this.isRematchRequested()) {
      return 'Warte auf den Gegner...';
    }
    if (this.opponentRequestedRematch()) {
      return 'Dein Gegner möchte eine Revanche.';
    }
    return null;
  });

  readonly showOpponentLeftFlyout = computed(
    () => !this.isFastGame() && this.isOpponentLeft() && this.isRematchRequested(),
  );

  readonly showSessionExpiredFlyout = computed(
    () => !this.isFastGame() && this.isSessionExpired() && this.isRematchRequested(),
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
          void this.router.navigate([this.playerNameStore.name() ? '/lobby' : '/']);
        }
        return;
      }
      if (game.phase === 'countdown') {
        // Rematch accepted: the lobby shows "Gegner gefunden" with the countdown.
        void this.router.navigate(['/lobby']);
      } else if (game.phase === 'question' || game.phase === 'reveal') {
        void this.router.navigate(['/quiz']);
      }
    });
    this.idleReset.arm();
  }

  ngOnDestroy(): void {
    this.idleReset.disarm();
  }

  handleHome(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby']);
  }

  async handlePlayAgain(): Promise<void> {
    if (this.isFastGame()) {
      this.gameClient.leave();
      void this.router.navigate(['/lobby'], { state: { fastGameRestart: true } });
      return;
    }
    const result = await this.gameClient.requestRematch();
    if (!result.ok) {
      console.warn(errorMessage(result.error));
    }
  }

  handleOpponentLeftAcknowledge(): void {
    this.handleHome();
  }
}
