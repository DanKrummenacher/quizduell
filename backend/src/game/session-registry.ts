import { randomBytes, randomUUID } from 'node:crypto';
import type { GameMode } from '../contracts/game.contract.js';
import type { GameSettings } from '../settings/game-settings.js';
import { generateGameCode } from './game-code.js';
import type { Player, Session } from './game.types.js';

export interface Seat {
  session: Session;
  player: Player;
}

/**
 * All sessions and players in memory, found by game code, socket or session
 * token. Knows nothing about the rules of the game.
 */
export class SessionRegistry {
  private readonly sessions = new Map<string, Session>();
  private readonly seats = new Map<string, Seat>();
  private readonly tokens = new Map<string, string>();
  private readonly sockets = new Map<string, string>();

  all(): Iterable<Session> {
    return this.sessions.values();
  }

  get(code: string): Session | undefined {
    return this.sessions.get(code);
  }

  has(code: string): boolean {
    return this.sessions.has(code);
  }

  create(mode: GameMode, settings: GameSettings): Session {
    const now = Date.now();
    const session: Session = {
      code: generateGameCode((code) => this.sessions.has(code)),
      mode,
      phase: 'waiting',
      endReason: null,
      players: [],
      departed: [],
      settings,
      questions: [],
      questionIndex: 0,
      phaseStartedAt: now,
      phaseEndsAt: null,
      timer: null,
      lastReveal: null,
      generation: 0,
      startedAt: now,
      rematch: false,
      rounds: [],
    };
    this.sessions.set(session.code, session);
    return session;
  }

  /** Forgets the session; its players must have been removed before. */
  delete(session: Session): boolean {
    return this.sessions.delete(session.code);
  }

  addPlayer(session: Session, socketId: string, name: string): Player {
    const player: Player = {
      id: randomUUID(),
      sessionToken: randomBytes(24).toString('base64url'),
      name,
      socketId,
      score: 0,
      answerIndex: null,
      answerTimeMs: null,
      lastPoints: 0,
      rematchRequested: false,
      disconnectTimer: null,
    };
    session.players.push(player);
    this.seats.set(player.id, { player, session });
    this.tokens.set(player.sessionToken, player.id);
    this.sockets.set(socketId, player.id);
    return player;
  }

  forgetPlayer(player: Player): void {
    this.seats.delete(player.id);
    this.tokens.delete(player.sessionToken);
    if (player.socketId && this.sockets.get(player.socketId) === player.id) {
      this.sockets.delete(player.socketId);
    }
  }

  /** Points the socket at the player, e.g. after a reconnect. */
  bindSocket(player: Player, socketId: string): void {
    if (player.socketId && player.socketId !== socketId) {
      this.sockets.delete(player.socketId);
    }
    player.socketId = socketId;
    this.sockets.set(socketId, player.id);
  }

  unbindSocket(socketId: string): void {
    this.sockets.delete(socketId);
  }

  bySocket(socketId: string): Seat | undefined {
    const playerId = this.sockets.get(socketId);
    return playerId ? this.seats.get(playerId) : undefined;
  }

  /** The seat of a session token, as long as its session still exists. */
  byToken(sessionToken: string): Seat | undefined {
    const playerId = this.tokens.get(sessionToken);
    const seat = playerId ? this.seats.get(playerId) : undefined;
    return seat && this.sessions.has(seat.session.code) ? seat : undefined;
  }
}
