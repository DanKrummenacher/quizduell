import { Injectable, Logger } from '@nestjs/common';
import {
  ClientSession,
  GAME_CLEANUP_DELAY_MS,
  GameSession,
  Player,
  QUESTION_DURATION_MS,
  QUESTIONS_PER_GAME,
} from './game.types';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private activeGames = new Map<string, GameSession>();

  constructor(private readonly questionsService: QuestionsService) {}

  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getSession(gameCode: string): GameSession | undefined {
    return this.activeGames.get(gameCode);
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
      questions: this.questionsService.getRandomQuestions(QUESTIONS_PER_GAME),
      currentQuestionIndex: 0,
      status: 'lobby',
      rematchRequests: [],
    };

    this.activeGames.set(gameCode, session);
    this.logger.log(`New game created: ${gameCode} by ${playerName}`);
    return session;
  }

  joinGame(
    gameCode: string,
    socketId: string,
    playerName: string,
  ): GameSession | 'OWN_GAME' | null {
    const session = this.activeGames.get(gameCode);

    if (!session) {
      return null;
    }
    if (Object.keys(session.players).length >= 2) {
      return null;
    }

    if (session.players[socketId]) {
      return 'OWN_GAME';
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
      (p) =>
        p.currentAnswerIndex !== undefined && p.currentAnswerIndex !== null,
    );
  }

  evaluateRound(session: GameSession) {
    const MAX_TIME_MS = QUESTION_DURATION_MS;
    const currentQuestion = session.questions[session.currentQuestionIndex];

    for (const player of Object.values(session.players)) {
      if (player.currentAnswerIndex === currentQuestion.correctAnswerIndex) {
        this.addPointsToPlayer(player, MAX_TIME_MS);
      }
      player.currentAnswerIndex = null;
      player.answerTimeMs = null;
    }
  }

  private addPointsToPlayer(player: Player, maxTimeMs: number) {
    const timeTakenMs = player.answerTimeMs ?? maxTimeMs;
    const remainingMs = Math.max(0, maxTimeMs - timeTakenMs);
    const bonus = 100 * (remainingMs / maxTimeMs);
    player.score += 100 + Math.round(bonus);
  }

  nextRound(session: GameSession): boolean {
    session.currentQuestionIndex++;
    if (session.currentQuestionIndex >= session.questions.length) {
      session.status = 'result';
      return false;
    }
    return true;
  }

  toClientSession(session: GameSession): ClientSession {
    const clientPlayers: Record<
      string,
      { socketId: string; name: string; score: number }
    > = {};

    for (const [key, player] of Object.entries(session.players)) {
      clientPlayers[key] = {
        socketId: player.socketId,
        name: player.name,
        score: player.score,
      };
    }

    return {
      gameCode: session.gameCode,
      players: clientPlayers,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      status: session.status,
    };
  }

  removeGame(gameCode: string) {
    if (this.activeGames.delete(gameCode)) {
      this.logger.log(`Game removed: ${gameCode}`);
    }
  }

  markSessionAborted(gameCode: string) {
    const session = this.activeGames.get(gameCode);
    if (session) {
      session.status = 'aborted' as any;
      if (session.roundTimer) {
        clearTimeout(session.roundTimer);
      }
    }
  }

  scheduleGameCleanup(gameCode: string, onCleanup?: () => void) {
    const session = this.activeGames.get(gameCode);
    if (!session) return;

    if (session.roundTimer) {
      clearTimeout(session.roundTimer);
    }

    session.roundTimer = setTimeout(() => {
      if (onCleanup) onCleanup();
      this.activeGames.delete(gameCode);
      this.logger.log(`Game removed: ${gameCode}`);
    }, GAME_CLEANUP_DELAY_MS);
  }

  handleRematchRequest(gameCode: string, socketId: string): boolean {
    const session = this.activeGames.get(gameCode);
    if (!session) return false;

    if (!session.rematchRequests.includes(socketId)) {
      session.rematchRequests.push(socketId);
    }

    return (
      session.rematchRequests.length === Object.keys(session.players).length &&
      Object.keys(session.players).length === 2
    );
  }

  restartGame(gameCode: string): GameSession | null {
    const session = this.activeGames.get(gameCode);
    if (!session) return null;

    if (session.roundTimer) clearTimeout(session.roundTimer);

    session.status = 'pre-game';
    session.rematchRequests = [];
    session.rematchTimer = undefined;
    session.currentQuestionIndex = 0;
    session.questions =
      this.questionsService.getRandomQuestions(QUESTIONS_PER_GAME);
    session.questionStartTimeMs = undefined;

    for (const player of Object.values(session.players)) {
      player.score = 0;
      player.currentAnswerIndex = null;
      player.answerTimeMs = null;
    }

    this.logger.log(`Game restarted: ${gameCode}`);
    return session;
  }
}
