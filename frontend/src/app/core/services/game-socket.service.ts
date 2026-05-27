import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {
  GameSessionState,
  QuestionData,
  RoundResultData,
} from '../models/game-socket.types';
import { SocketEvents } from '../models/socket-events';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameSocketService {
  private socket: Socket;

  public session = signal<GameSessionState | null>(null);
  public currentQuestion = signal<QuestionData | null>(null);
  public roundResult = signal<RoundResultData | null>(null);
  public opponentAnswered = signal<boolean>(false);
  public opponentLeft = signal<boolean>(false);
  public gameOver = signal<boolean>(false);
  public connectionError = signal<string | null>(null);
  public opponentRequestedRematch = signal<boolean>(false);
  public sessionExpired = signal<boolean>(false);
  public gameMode = signal<'FAST_GAME' | 'CHALLENGE' | null>(null);

  constructor() {
    this.socket = io(environment.backendUrl, {
      autoConnect: false,
    });

    this.registerListeners();
  }

  private registerListeners() {
    this.socket.on('connect', () => {
      this.connectionError.set(null);
    });

    this.socket.on('connect_error', () => {
      this.connectionError.set('Keine Verbindung zum Server möglich.');
    });

    this.socket.on(SocketEvents.GAME_CREATED, (data: GameSessionState) => {
      this.resetGameState(data);
    });

    this.socket.on(SocketEvents.GAME_START, (data: GameSessionState) => {
      this.resetGameState(data);
    });

    this.socket.on(SocketEvents.NEW_QUESTION, (question: QuestionData) => {
      this.currentQuestion.set(question);
      this.opponentAnswered.set(false);
      this.roundResult.set(null);

      const currentSession = this.session();
      if (currentSession) {
        this.session.set({
          ...currentSession,
          currentQuestionIndex: question.questionIndex,
        });
      }
    });

    this.socket.on(SocketEvents.OPPONENT_ANSWERED, () => {
      this.opponentAnswered.set(true);
    });

    this.socket.on(SocketEvents.OPPONENT_LEFT, () => {
      this.opponentLeft.set(true);
    });

    this.socket.on(SocketEvents.OPPONENT_REQUESTED_REMATCH, () => {
      this.opponentRequestedRematch.set(true);
    });

    this.socket.on(SocketEvents.SESSION_EXPIRED, () => {
      this.sessionExpired.set(true);
    });

    this.socket.on(SocketEvents.ROUND_RESULT, (data: RoundResultData) => {
      this.roundResult.set(data);
      this.session.set(data.session);
    });

    this.socket.on(SocketEvents.GAME_OVER, (session: GameSessionState) => {
      this.session.set(session);
      this.gameOver.set(true);
    });

    this.socket.on(SocketEvents.ERROR, (msg: string) => {
      if (msg === 'Game not found or full') {
        this.connectionError.set(
          'Dieser Raumcode ist ungültig oder das Spiel ist bereits voll.',
        );
      } else if (msg === 'Cannot join own game') {
        this.connectionError.set('Du kannst deinem eigenen Spiel nicht beitreten.');
      } else {
        this.connectionError.set(msg);
      }
    });
  }

  public connect() {
    if (this.socket.disconnected) {
      this.socket.connect();
    }
  }

  public createGame(playerName: string) {
    this.connect();
    this.connectionError.set(null);
    this.gameMode.set('CHALLENGE');
    this.socket.emit(SocketEvents.CREATE_GAME, { playerName });
  }

  public startMatchmaking(playerName: string) {
    this.connect();
    this.connectionError.set(null);
    this.gameMode.set('FAST_GAME');
    this.socket.emit('startMatchmaking', { playerName });
  }

  public cancelMatchmaking() {
    this.socket.emit('cancelMatchmaking');
  }

  public joinGame(gameCode: string, playerName: string) {
    this.connect();
    this.connectionError.set(null);
    this.gameMode.set('CHALLENGE');
    this.socket.emit(SocketEvents.JOIN_GAME, { gameCode, playerName });
  }

  public submitAnswer(gameCode: string, answerIndex: number, timeTakenMs: number) {
    this.socket.emit(SocketEvents.SUBMIT_ANSWER, {
      gameCode,
      answerIndex,
      timeTakenMs,
    });
  }

  public getSocketId(): string {
    return this.socket.id || '';
  }

  public requestRematch() {
    this.socket.emit(SocketEvents.REMATCH_REQUEST);
  }

  public resetGame() {
    this.session.set(null);
    this.currentQuestion.set(null);
    this.roundResult.set(null);
    this.opponentAnswered.set(false);
    this.opponentLeft.set(false);
    this.gameOver.set(false);
    this.connectionError.set(null);
    this.gameMode.set(null);

    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  private resetGameState(data: GameSessionState) {
    this.session.set(data);
    this.currentQuestion.set(null);
    this.roundResult.set(null);
    this.opponentAnswered.set(false);
    this.opponentLeft.set(false);
    this.gameOver.set(false);
    this.opponentRequestedRematch.set(false);
    this.sessionExpired.set(false);
  }
}
