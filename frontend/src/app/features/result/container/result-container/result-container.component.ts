import { Component, computed, inject } from '@angular/core';
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
  }

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
    const sorted = [...this.rawPlayers()].sort((a, b) => b.score - a.score);
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
    this.socketService.resetGame();
    void this.router.navigate(['/']);
  }
}
