import { Component, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ResultUiComponent } from '../../components/result-ui/result-ui.component';
import { GameSocketService } from '../../../../core/services/game-socket.service';
import { PlayerResultView } from '../../result.types';

@Component({
  selector: 'app-result-container',
  imports: [ResultUiComponent],
  templateUrl: './result-container.component.html',
})
export class ResultContainerComponent {
  private readonly router = inject(Router);
  private readonly socketService = inject(GameSocketService);

  constructor() {
    if (!this.socketService.session()) {
      void this.router.navigate(['/']);
    }

    effect(() => {
      const session = this.socketService.session();
      if (session && session.status === 'pre-game') {
        const playerName = this.rawPlayers().find((p) => p.isMe)?.name || '';
        void this.router.navigate(['/lobby'], { state: { playerName } });
      }
    });
  }

  readonly isRematchRequested = signal(false);
  readonly isOpponentLeft = this.socketService.opponentLeft;
  readonly opponentRequestedRematch = this.socketService.opponentRequestedRematch;
  readonly isSessionExpired = this.socketService.sessionExpired;
  readonly gameMode = this.socketService.gameMode;

  readonly isPlayAgainDisabled = computed(() => {
    if (this.gameMode() === 'FAST_GAME') return false;
    return (
      this.isRematchRequested() || this.isOpponentLeft() || this.isSessionExpired()
    );
  });

  readonly playAgainText = computed(() => {
    if (this.gameMode() === 'FAST_GAME') return 'Erneut Spielen';
    if (this.isSessionExpired() || this.isOpponentLeft()) return 'Erneut Spielen';
    if (this.isRematchRequested()) return 'Anfrage gesendet';
    if (this.opponentRequestedRematch()) return 'Revanche annehmen!';
    return 'Erneut Spielen';
  });

  readonly playAgainIcon = computed(() => {
    if (this.gameMode() === 'FAST_GAME') return 'undo';
    if (this.isSessionExpired() || this.isOpponentLeft()) return 'undo';
    if (this.isRematchRequested()) return 'paper-plane';
    if (this.opponentRequestedRematch()) return 'checkmark-circle';
    return 'undo';
  });

  readonly playAgainStatusText = computed(() => {
    if (this.gameMode() === 'FAST_GAME') return null;
    if (this.isSessionExpired()) return 'Die Spielsitzung wurde beendet.';
    if (this.isOpponentLeft()) return 'Dein Gegner hat das Spiel verlassen!';
    if (this.isRematchRequested()) return 'Warte auf den Gegner...';
    if (this.opponentRequestedRematch()) return 'Dein Gegner möchte eine Revanche.';
    return null;
  });

  readonly showOpponentLeftFlyout = computed(() => {
    return (
      this.gameMode() !== 'FAST_GAME' &&
      this.isOpponentLeft() &&
      this.isRematchRequested() &&
      !this.isSessionExpired()
    );
  });

  readonly showSessionExpiredFlyout = computed(() => {
    return this.gameMode() !== 'FAST_GAME' && this.isSessionExpired();
  });

  readonly rawPlayers = computed(() => {
    const session = this.socketService.session();
    const myId = this.socketService.getSocketId();

    if (!session) return [];

    return Object.values(session.players).map((p) => ({
      name: p.name,
      score: p.score,
      isMe: p.socketId === myId,
    }));
  });

  readonly gameResult = computed(() => {
    const players = this.rawPlayers();
    if (players.length < 2) return 'DRAW';

    const me = players.find((p) => p.isMe);
    const opponent = players.find((p) => !p.isMe);

    if (!me || !opponent) return 'DRAW';

    if (me.score > opponent.score) return 'WIN';
    if (me.score < opponent.score) return 'LOSS';
    return 'DRAW';
  });

  readonly playersView = computed<PlayerResultView[]>(() => {
    const sorted = [...this.rawPlayers()];
    sorted.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.isMe ? -1 : 1;
    });
    const result = this.gameResult();

    return sorted.map((p) => {
      let state: 'win' | 'loss' | 'default' = 'default';

      if (p.isMe) {
        if (result === 'WIN') state = 'win';
        if (result === 'LOSS') state = 'loss';
      }

      return { name: p.name, score: p.score, cardState: state, isMe: p.isMe };
    });
  });

  readonly statusTitle = computed(() => {
    if (this.gameResult() === 'WIN') return 'Gewonnen!';
    if (this.gameResult() === 'LOSS') return 'Verloren!';
    return 'Unentschieden!';
  });

  readonly statusSubtitle = computed(() => {
    if (this.gameResult() === 'WIN') return 'Du hast deinen Gegner geschlagen';
    if (this.gameResult() === 'LOSS')
      return 'Kopf hoch, die nächste Runde gehört dir';
    return 'Ihr wart exakt gleich gut';
  });

  readonly statusIcon = computed(() => {
    if (this.gameResult() === 'WIN') return 'trophy';
    if (this.gameResult() === 'LOSS') return 'lightning-strike';
    return 'handshake';
  });

  handleHome() {
    const playerName = this.rawPlayers().find((p) => p.isMe)?.name || '';
    this.socketService.resetGame();
    void this.router.navigate(['/lobby'], { state: { playerName } });
  }

  handlePlayAgain() {
    const gameMode = this.socketService.gameMode();
    const playerName = this.rawPlayers().find((p) => p.isMe)?.name || '';

    if (gameMode === 'FAST_GAME') {
      this.socketService.resetGame();
      void this.router.navigate(['/lobby'], {
        state: { playerName, fastGameRestart: true },
      });
    } else {
      this.isRematchRequested.set(true);
      this.socketService.requestRematch();
    }
  }

  handleOpponentLeftAcknowledge() {
    const playerName = this.rawPlayers().find((p) => p.isMe)?.name || '';
    this.socketService.resetGame();
    void this.router.navigate(['/lobby'], { state: { playerName } });
  }
}
