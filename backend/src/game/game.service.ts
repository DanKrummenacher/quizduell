import { Injectable, Logger } from '@nestjs/common';
import { GameSession, Player } from './game.types';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  private activeGames = new Map<string, GameSession>();

  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createGame(socketId: string, playerName: string): GameSession {
    let gameCode = this.generateGameCode();
    while (this.activeGames.has(gameCode)) {
      gameCode = this.generateGameCode();
    }

    const newPlayer: Player = { socketId, name: playerName, score: 0 };

    const session: GameSession = {
      gameCode,
      players: { [socketId]: newPlayer },
      questions: [],
      currentQuestionIndex: 0,
      status: 'lobby',
    };

    this.activeGames.set(gameCode, session);
    this.logger.log(`New game created: ${gameCode} by ${playerName}`);
    return session;
  }

  joinGame(
    gameCode: string,
    socketId: string,
    playerName: string,
  ): GameSession | null {
    const session = this.activeGames.get(gameCode);

    if (!session) {
      return null;
    }

    if (Object.keys(session.players).length >= 2) {
      return null;
    }

    session.players[socketId] = { socketId, name: playerName, score: 0 };
    session.status = 'pre-game';
    this.logger.log(`Player ${playerName} joined game ${gameCode}`);

    return session;
  }

  submitAnswer(
    gameCode: string,
    socketId: string,
    answerIndex: number,
    timeTakenMs: number,
  ): GameSession | null {
    const session = this.activeGames.get(gameCode);
    if (!session) return null;

    const player = session.players[socketId];
    if (player) {
      player.currentAnswerIndex = answerIndex;
      player.answerTimeMs = timeTakenMs;
    }

    return session;
  }

  bothPlayersAnswered(session: GameSession): boolean {
    const players = Object.values(session.players);
    if (players.length !== 2) return false;

    return players.every(
      (p) => p.currentAnswerIndex !== undefined && p.currentAnswerIndex !== null,
    );
  }

  evaluateRound(session: GameSession, correctAnswerIndex: number) {
    const MAX_TIME_MS = 20000;

    for (const player of Object.values(session.players)) {
      if (player.currentAnswerIndex === correctAnswerIndex) {
        const timeTakenMs = player.answerTimeMs || MAX_TIME_MS;
        const remainingMs = Math.max(0, MAX_TIME_MS - timeTakenMs);

        const bonus = 100 * (remainingMs / MAX_TIME_MS);
        const pointsThisRound = 100 + Math.round(bonus);

        player.score += pointsThisRound;
      }

      player.currentAnswerIndex = null;
      player.answerTimeMs = null;
    }
  }

  getGameSession(gameCode: string): GameSession | undefined {
    return this.activeGames.get(gameCode);
  }
}
