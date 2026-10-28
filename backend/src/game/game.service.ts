import {
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import type { LiveSnapshot } from '../contracts/admin.contract.js';
import type { EndReason } from '../contracts/game.contract.js';
import { QuestionsService } from '../questions/questions.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StatsService } from '../stats/stats.service.js';
import { buildView, totalQuestions } from './game-view.js';
import {
  COUNTDOWN_MS,
  DISCONNECT_GRACE_MS,
  LEAVE_GRACE_MS,
  GameError,
  SESSION_RETENTION_MS,
  WAITING_TIMEOUT_MS,
  type GameNotifier,
  type LiveStats,
  type Player,
  type Session,
} from './game.types.js';
import { isRunning, LiveMonitor, type QueueEntry } from './live-monitor.js';
import { questionResultOf, settleRound } from './scoring.js';
import { type Seat, SessionRegistry } from './session-registry.js';
import {
  clearAllTimers,
  clearSessionTimer,
  setSessionTimer,
} from './session-timers.js';

/**
 * Server-authoritative game engine. Owns all sessions, timers and scoring;
 * the gateway only translates socket messages into calls on this service.
 */
@Injectable()
export class GameService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(GameService.name);
  private readonly registry = new SessionRegistry();
  private queue: QueueEntry[] = [];
  private notifier: GameNotifier | null = null;
  private readonly live = new LiveMonitor({
    sessions: () => this.registry.all(),
    queue: () => this.queue,
    paused: () => this.settingsService.isPaused(),
  });

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
    private readonly statsService: StatsService,
  ) {}

  attachNotifier(notifier: GameNotifier): void {
    this.notifier = notifier;
  }

  onModuleInit(): void {
    this.live.start();
  }

  onApplicationShutdown(): void {
    this.live.stop();
    for (const session of this.registry.all()) {
      this.removeSession(session);
    }
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  async createFriendGame(socketId: string, name: string): Promise<void> {
    this.leaveEverything(socketId);
    this.assertOpen();
    await this.assertEnoughQuestions();
    this.leaveEverything(socketId);

    const session = this.registry.create('friend', this.settingsService.get());
    this.registry.addPlayer(session, socketId, name);
    session.phase = 'waiting';
    this.setTimer(session, WAITING_TIMEOUT_MS, () => {
      this.live.record(session, 'expired');
      this.removeSession(session);
    });
    this.logger.log(`Friend game ${session.code} created`);
    this.live.record(session, 'created');
    this.broadcast(session);
  }

  joinFriendGame(socketId: string, code: string, name: string): void {
    const session = this.registry.get(code);
    if (!session || session.mode !== 'friend') {
      throw new GameError('GAME_NOT_FOUND');
    }
    if (session.players.some((player) => player.socketId === socketId)) {
      throw new GameError('OWN_GAME');
    }
    if (session.phase !== 'waiting' || session.players.length >= 2) {
      throw new GameError('GAME_FULL');
    }
    this.assertOpen();

    this.leaveEverything(socketId);
    this.registry.addPlayer(session, socketId, name);
    this.logger.log(`Player joined friend game ${session.code}`);
    this.live.record(session, 'joined');
    this.startCountdown(session);
  }

  /** Matches the player with someone from the queue, or queues them. */
  async startMatchmaking(
    socketId: string,
    name: string,
  ): Promise<'matched' | 'queued'> {
    this.leaveEverything(socketId);
    this.assertOpen();
    await this.assertEnoughQuestions();
    this.leaveEverything(socketId);

    const opponent = this.queue.shift();
    if (!opponent) {
      this.queue.push({ socketId, name, since: Date.now() });
      return 'queued';
    }

    const session = this.registry.create('quick', this.settingsService.get());
    this.registry.addPlayer(session, opponent.socketId, opponent.name);
    this.registry.addPlayer(session, socketId, name);
    this.logger.log(`Quick game ${session.code} matched`);
    this.live.record(session, 'matched');
    this.startCountdown(session);
    return 'matched';
  }

  cancelMatchmaking(socketId: string): void {
    this.queue = this.queue.filter((entry) => entry.socketId !== socketId);
  }

  submitAnswer(socketId: string, questionIndex: number, answerIndex: number): void {
    const { session, player } = this.requirePlayer(socketId);
    const question = session.questions[session.questionIndex];
    const valid =
      session.phase === 'question' &&
      question !== undefined &&
      questionIndex === session.questionIndex &&
      player.answerIndex === null &&
      Number.isInteger(answerIndex) &&
      answerIndex >= 0 &&
      answerIndex < question.options.length;
    if (!valid) {
      throw new GameError('ANSWER_REJECTED');
    }

    player.answerIndex = answerIndex;
    player.answerTimeMs = Date.now() - session.phaseStartedAt;

    if (session.players.every((p) => p.answerIndex !== null)) {
      this.reveal(session);
    } else {
      this.broadcast(session);
    }
  }

  requestRematch(socketId: string): void {
    const { session, player } = this.requirePlayer(socketId);
    if (!this.isRematchAvailable(session)) {
      throw new GameError('REMATCH_UNAVAILABLE');
    }
    this.assertOpen();

    const firstRequest = !session.players.some((p) => p.rematchRequested);
    player.rematchRequested = true;
    if (session.players.every((p) => p.rematchRequested)) {
      this.restart(session);
    } else if (firstRequest) {
      // The opponent gets the full time to answer, counted from the request.
      this.openRematchWindow(session);
    } else {
      this.broadcast(session);
    }
  }

  /**
   * Leaves the socket's game and queue. With a session token it leaves that
   * player's game instead, e.g. one stored by an earlier page load.
   */
  leave(socketId: string, sessionToken?: string): void {
    if (sessionToken === undefined) {
      this.leaveEverything(socketId);
      return;
    }
    const seat = this.registry.byToken(sessionToken);
    if (seat) {
      this.removePlayer(seat.session, seat.player, 'opponent-left');
    }
  }

  resume(socketId: string, sessionToken: string): void {
    const seat = this.registry.byToken(sessionToken);
    if (!seat) {
      throw new GameError('SESSION_NOT_FOUND');
    }

    const { player, session } = seat;
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    this.registry.bindSocket(player, socketId);
    this.broadcast(session);
  }

  /**
   * A lost connection keeps the player in the game for a grace period so a
   * reload or a short network gap does not end the duel. `closedByPage` marks
   * a connection the page closed itself while unloading.
   */
  handleDisconnect(socketId: string, closedByPage = false): void {
    this.cancelMatchmaking(socketId);
    const seat = this.registry.bySocket(socketId);
    this.registry.unbindSocket(socketId);
    if (!seat || seat.player.socketId !== socketId) {
      return;
    }

    const { player, session } = seat;
    player.socketId = null;
    player.disconnectTimer = setTimeout(
      () => {
        player.disconnectTimer = null;
        this.removePlayer(
          session,
          player,
          closedByPage ? 'opponent-left' : 'opponent-disconnected',
        );
      },
      closedByPage ? LEAVE_GRACE_MS : DISCONNECT_GRACE_MS,
    );
    this.broadcast(session);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getLiveStats(): LiveStats {
    return this.live.stats();
  }

  /** Everything the admin shows on its live page. */
  getLiveSnapshot(): LiveSnapshot {
    return this.live.snapshot();
  }

  // ---------------------------------------------------------------------------
  // Game flow
  // ---------------------------------------------------------------------------

  private startCountdown(session: Session): void {
    const generation = ++session.generation;
    for (const player of session.players) {
      player.score = 0;
      player.answerIndex = null;
      player.answerTimeMs = null;
      player.lastPoints = 0;
      player.rematchRequested = false;
    }
    session.settings = this.settingsService.get();
    session.questions = [];
    session.questionIndex = 0;
    session.departed = [];
    session.lastReveal = null;
    session.endReason = null;
    session.startedAt = Date.now();
    session.rounds = [];
    this.enterPhase(session, 'countdown', COUNTDOWN_MS, () =>
      this.startQuestion(session),
    );

    this.questionsService
      .pickRandom(session.settings.questionsPerGame)
      .then((questions) => {
        if (session.generation !== generation || !this.registry.has(session.code)) {
          return;
        }
        session.questions = questions;
        this.broadcast(session);
      })
      .catch((error: unknown) => {
        this.logger.error(`Could not load questions: ${String(error)}`);
      });
  }

  private startQuestion(session: Session): void {
    if (session.questions.length === 0) {
      this.logger.warn(`Game ${session.code} has no questions, aborting`);
      this.abort(session, 'expired');
      return;
    }
    for (const player of session.players) {
      player.answerIndex = null;
      player.answerTimeMs = null;
    }
    const durationMs = session.settings.questionDurationSec * 1000;
    this.enterPhase(session, 'question', durationMs, () => this.reveal(session));
  }

  private reveal(session: Session): void {
    if (session.phase !== 'question') {
      return;
    }
    const question = session.questions[session.questionIndex]!;
    settleRound(session, question);
    this.questionsService
      .recordResults([questionResultOf(question, session.players)])
      .catch((error: unknown) => {
        this.logger.error(
          `Could not record question stats for ${session.code}: ${String(error)}`,
        );
      });

    const isLast = session.questionIndex >= session.questions.length - 1;
    this.enterPhase(
      session,
      'reveal',
      session.settings.revealDurationSec * 1000,
      () => {
        if (isLast) {
          this.finish(session);
        } else {
          session.questionIndex++;
          this.startQuestion(session);
        }
      },
    );
  }

  private finish(session: Session): void {
    this.recordGame(session, 'finished');
    this.live.record(session, 'finished', {
      scores: session.players.map((player) => player.score),
    });
    // Both modes offer a rematch against the same opponent for a while.
    this.openRematchWindow(session);
  }

  /** Starts (or restarts) the time in which a rematch can be agreed on. */
  private openRematchWindow(session: Session): void {
    const rematchMs = session.settings.rematchTimeoutSec * 1000;
    this.enterPhase(session, 'finished', rematchMs, () =>
      this.expireRematch(session),
    );
  }

  private expireRematch(session: Session): void {
    session.phaseEndsAt = null;
    this.setTimer(session, SESSION_RETENTION_MS, () => this.removeSession(session));
    this.broadcast(session);
  }

  private restart(session: Session): void {
    this.logger.log(`Rematch in game ${session.code}`);
    session.rematch = true;
    this.live.record(session, 'rematch');
    this.startCountdown(session);
  }

  private abort(session: Session, reason: EndReason): void {
    session.endReason = reason;
    this.recordGame(session, 'aborted');
    this.live.record(session, 'aborted', { reason });
    this.enterPhase(session, 'aborted', null, null);
    this.setTimer(session, SESSION_RETENTION_MS, () => this.removeSession(session));
  }

  private isRematchAvailable(session: Session): boolean {
    return (
      session.phase === 'finished' &&
      session.phaseEndsAt !== null &&
      session.endReason === null &&
      session.players.length === 2 &&
      session.players.every((player) => player.socketId !== null)
    );
  }

  private recordGame(session: Session, status: 'finished' | 'aborted'): void {
    const people = [...session.players, ...session.departed];
    void this.statsService.recordGame({
      mode: session.mode,
      status,
      endReason: status === 'aborted' ? session.endReason : null,
      questionCount: totalQuestions(session),
      questionsPlayed: session.rounds.length,
      rematch: session.rematch,
      durationMs: Date.now() - session.startedAt,
      scores: people.map((player) => player.score),
    });
  }

  // ---------------------------------------------------------------------------
  // Session and player bookkeeping
  // ---------------------------------------------------------------------------

  /** Removes a player from their session and informs the opponent. */
  private removePlayer(session: Session, player: Player, reason: EndReason): void {
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }
    session.players = session.players.filter((p) => p.id !== player.id);
    session.departed.push({ ...player, socketId: null, disconnectTimer: null });
    this.registry.forgetPlayer(player);

    if (session.players.length === 0 || session.phase === 'waiting') {
      this.removeSession(session);
      return;
    }

    if (isRunning(session)) {
      this.abort(session, reason);
    } else if (session.phase === 'finished') {
      session.endReason = reason;
      session.phaseEndsAt = null;
      this.setTimer(session, SESSION_RETENTION_MS, () =>
        this.removeSession(session),
      );
      this.broadcast(session);
    } else {
      this.broadcast(session);
    }
  }

  private removeSession(session: Session): void {
    clearAllTimers(session);
    for (const player of session.players) {
      this.registry.forgetPlayer(player);
    }
    session.players = [];
    if (this.registry.delete(session)) {
      this.logger.log(`Game ${session.code} removed`);
    }
  }

  /** Removes a socket from the queue and from any game it is part of. */
  private leaveEverything(socketId: string): void {
    this.cancelMatchmaking(socketId);
    const seat = this.registry.bySocket(socketId);
    if (seat) {
      this.removePlayer(seat.session, seat.player, 'opponent-left');
    }
  }

  private requirePlayer(socketId: string): Seat {
    const seat = this.registry.bySocket(socketId);
    if (!seat) {
      throw new GameError('NOT_IN_GAME');
    }
    return seat;
  }

  /** While the admin paused the game, no new duel starts. */
  private assertOpen(): void {
    if (this.settingsService.isPaused()) {
      throw new GameError('PAUSED');
    }
  }

  private async assertEnoughQuestions(): Promise<void> {
    const required = this.settingsService.get().questionsPerGame;
    const available = await this.questionsService.countActive();
    if (available < required) {
      throw new GameError('NOT_ENOUGH_QUESTIONS');
    }
  }

  // ---------------------------------------------------------------------------
  // Timers and notifications
  // ---------------------------------------------------------------------------

  private enterPhase(
    session: Session,
    phase: Session['phase'],
    durationMs: number | null,
    onEnd: (() => void) | null,
  ): void {
    session.phase = phase;
    session.phaseStartedAt = Date.now();
    session.phaseEndsAt =
      durationMs !== null ? session.phaseStartedAt + durationMs : null;
    if (durationMs !== null && onEnd) {
      this.setTimer(session, durationMs, onEnd);
    } else {
      clearSessionTimer(session);
    }
    this.broadcast(session);
  }

  private setTimer(session: Session, delayMs: number, callback: () => void): void {
    setSessionTimer(session, delayMs, callback, this.logger);
  }

  private broadcast(session: Session): void {
    if (!this.notifier) {
      return;
    }
    for (const player of session.players) {
      if (player.socketId) {
        this.notifier.sendState(player.socketId, buildView(session, player));
      }
    }
  }
}
