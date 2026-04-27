import { Injectable, signal } from '@angular/core';

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

  updateState(partialState: Partial<GameState>) {
    this.state.update(s => ({ ...s, ...partialState }));
  }
}
