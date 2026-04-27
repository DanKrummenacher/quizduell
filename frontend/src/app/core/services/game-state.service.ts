import { Injectable, signal, inject } from '@angular/core';
import { SocketService } from './socket.service';

export interface GameState {
  playerName: string;
  opponentName: string | null;
  gameCode: string | null;
  status: 'start' | 'lobby' | 'pre-game' | 'in-game' | 'result';
  currentQuestion: any | null;
  questionIndex: number;
  totalQuestions: number;
  playerScore: number;
  opponentScore: number;
  timeLeft: number;
  winner: 'player' | 'opponent' | 'draw' | null;
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // Using modern Angular Signals for state management
  readonly state = signal<GameState>({
    playerName: '',
    opponentName: null,
    gameCode: null,
    status: 'start',
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 7,
    playerScore: 0,
    opponentScore: 0,
    timeLeft: 20,
    winner: null
  });

  private socketService = inject(SocketService);

  constructor() {
    this.setupSocketListeners();
  }

  updateState(partialState: Partial<GameState>) {
    this.state.update(s => ({ ...s, ...partialState }));
  }

  private setupSocketListeners() {
    this.socketService.on('gameCreated', (data: any) => {
      this.updateState({ gameCode: data.gameCode, status: 'lobby' });
    });

    this.socketService.on('gameStart', (session: any) => {
      // Find opponent name
      const opponent = Object.values(session.players).find((p: any) => p.name !== this.state().playerName) as any;
      this.updateState({
        status: 'pre-game',
        opponentName: opponent ? opponent.name : 'Gegner',
      });
    });

    this.socketService.on('roundResult', (session: any) => {
      const me = Object.values(session.players).find((p: any) => p.name === this.state().playerName) as any;
      const opponent = Object.values(session.players).find((p: any) => p.name !== this.state().playerName) as any;
      
      this.updateState({
        playerScore: me?.score || 0,
        opponentScore: opponent?.score || 0,
      });
    });

    this.socketService.on('opponentLeft', () => {
      // Simple error handling
      this.updateState({ status: 'start', gameCode: null, opponentName: null });
      alert('Der Gegner hat das Spiel verlassen.');
    });
  }

  // Actions
  createGame(playerName: string) {
    this.updateState({ playerName });
    this.socketService.connect();
    this.socketService.emit('createGame', { playerName });
  }

  joinGame(gameCode: string, playerName: string) {
    this.updateState({ playerName, gameCode });
    this.socketService.connect();
    this.socketService.emit('joinGame', { gameCode, playerName });
  }

  submitAnswer(answerIndex: number, timeTakenMs: number) {
    this.socketService.emit('submitAnswer', {
      gameCode: this.state().gameCode,
      answerIndex,
      timeTakenMs
    });
  }
}
