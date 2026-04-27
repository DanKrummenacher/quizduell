import { Injectable, Logger } from '@nestjs/common';
import { GameSession, Player } from './game.types';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  
  // In-memory store for active game sessions
  private activeGames = new Map<string, GameSession>();

  /**
   * Generates a 4-character random game code (e.g., A7B9)
   */
  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Creates a new game session and adds the host player.
   */
  createGame(socketId: string, playerName: string): GameSession {
    let gameCode = this.generateGameCode();
    while (this.activeGames.has(gameCode)) {
      gameCode = this.generateGameCode();
    }

    const newPlayer: Player = { socketId, name: playerName, score: 0 };
    
    const session: GameSession = {
      gameCode,
      players: { [socketId]: newPlayer },
      questions: [], // We will fetch this from DB later
      currentQuestionIndex: 0,
      status: 'lobby',
    };

    this.activeGames.set(gameCode, session);
    this.logger.log(`New game created: ${gameCode} by ${playerName}`);
    return session;
  }

  /**
   * Adds a second player to an existing game.
   */
  joinGame(gameCode: string, socketId: string, playerName: string): GameSession | null {
    const session = this.activeGames.get(gameCode);
    
    if (!session) {
      return null; // Game not found
    }
    
    if (Object.keys(session.players).length >= 2) {
      return null; // Game is full
    }

    session.players[socketId] = { socketId, name: playerName, score: 0 };
    session.status = 'pre-game';
    this.logger.log(`Player ${playerName} joined game ${gameCode}`);
    
    return session;
  }

  /**
   * Registers a player's answer and calculates points based on the 200-point formula.
   */
  submitAnswer(gameCode: string, socketId: string, answerIndex: number, timeTakenMs: number): GameSession | null {
    const session = this.activeGames.get(gameCode);
    if (!session) return null;

    const player = session.players[socketId];
    if (player) {
      player.currentAnswerIndex = answerIndex;
      player.answerTimeMs = timeTakenMs;
    }

    return session;
  }

  /**
   * Checks if both players have submitted their answers.
   */
  bothPlayersAnswered(session: GameSession): boolean {
    const players = Object.values(session.players);
    if (players.length !== 2) return false;
    
    return players.every(p => p.currentAnswerIndex !== undefined && p.currentAnswerIndex !== null);
  }

  /**
   * Evaluates the round and calculates points based on the requested formula:
   * Max points: 200 (100 base + 100 time bonus)
   */
  evaluateRound(session: GameSession, correctAnswerIndex: number) {
    const MAX_TIME_MS = 20000;
    
    for (const player of Object.values(session.players)) {
      if (player.currentAnswerIndex === correctAnswerIndex) {
        // Calculate points based on the 200 point formula
        const timeTakenMs = player.answerTimeMs || MAX_TIME_MS;
        const remainingMs = Math.max(0, MAX_TIME_MS - timeTakenMs);
        
        // Formel: 100 + ( 100 x (Verbleibende Millisekunden / Gesamtzeit in Millisekunden))
        const bonus = 100 * (remainingMs / MAX_TIME_MS);
        const pointsThisRound = 100 + Math.round(bonus);
        
        player.score += pointsThisRound;
      }
      
      // Reset for next round
      player.currentAnswerIndex = null;
      player.answerTimeMs = null;
    }
  }

  getGameSession(gameCode: string): GameSession | undefined {
    return this.activeGames.get(gameCode);
  }
}
