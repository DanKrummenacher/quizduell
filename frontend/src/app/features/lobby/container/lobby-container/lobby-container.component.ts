import { Component, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { LobbyUiComponent } from '../../components/lobby-ui/lobby-ui.component';
import { GameSocketService } from '../../../../core/services/game-socket.service';
import { LobbyState } from '../../lobby.types';

@Component({
  selector: 'app-lobby-container',
  imports: [LobbyUiComponent],
  templateUrl: './lobby-container.component.html',
})
export class LobbyContainerComponent {
  private readonly router = inject(Router);
  private readonly socketService = inject(GameSocketService);

  readonly lobbyState = signal<LobbyState>('CHOOSE_MODE');

  readonly playerName = signal<string>('');
  readonly roomCode = signal<string>('');
  readonly opponentName = signal<string>('');
  readonly connectionError = computed(
    () => this.socketService.connectionError() || '',
  );
  readonly opponentLeft = this.socketService.opponentLeft;

  constructor() {
    const stateName = history.state?.playerName;
    const isFastGameRestart = history.state?.fastGameRestart;

    if (stateName) {
      this.playerName.set(stateName);
      if (isFastGameRestart) {
        this.lobbyState.set('SEARCHING');
        this.socketService.startMatchmaking(stateName);
      }
    } else {
      void this.router.navigate(['/']);
    }

    effect(() => {
      const session = this.socketService.session();
      if (!session) return;

      this.roomCode.set(session.gameCode);

      const myId = this.socketService.getSocketId();
      const players = Object.values(session.players);
      const opponent = players.find((p) => p.socketId !== myId);

      if (opponent) {
        this.opponentName.set(opponent.name);
      }

      if (session.status === 'pre-game' || session.status === 'in-game') {
        this.lobbyState.set('FOUND');
      }
    });

    effect(() => {
      if (this.socketService.currentQuestion()) {
        void this.router.navigate(['/quiz']);
      }
    });
  }

  handleOpponentLeftAcknowledge() {
    this.socketService.resetGame();
    this.lobbyState.set('CHOOSE_MODE');
  }
  handleBack() {
    const state = this.lobbyState();
    if (state === 'WAITING' || state === 'FOUND') {
      this.lobbyState.set('CHOOSE_ACTION');
    } else if (state === 'SEARCHING') {
      this.lobbyState.set('CHOOSE_MODE');
      this.socketService.cancelMatchmaking();
    } else if (state === 'CHOOSE_ACTION') {
      this.lobbyState.set('CHOOSE_MODE');
    } else {
      void this.router.navigate(['/']);
    }
  }

  handleSelectFastGame() {
    this.lobbyState.set('SEARCHING');
    this.socketService.startMatchmaking(this.playerName());
  }

  handleCancelSearch() {
    this.lobbyState.set('CHOOSE_MODE');
    this.socketService.cancelMatchmaking();
  }

  handleSelectChallenge() {
    this.lobbyState.set('CHOOSE_ACTION');
  }

  handleCreate() {
    this.socketService.createGame(this.playerName());
    this.lobbyState.set('WAITING');
  }

  handleJoin(code: string) {
    this.socketService.joinGame(code, this.playerName());
  }
}
