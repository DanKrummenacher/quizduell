import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type {
  EndReason,
  GameMode,
  GameStateView,
  PlayerView,
} from '../contracts/game.contract.js';
import {
  QuestionsService,
  type QuestionResult,
} from '../questions/questions.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StatsService } from '../stats/stats.service.js';
import { generateGameCode } from './game-code.js';
import {
  BASE_POINTS,
  COUNTDOWN_MS,
  DISCONNECT_GRACE_MS,
  LEAVE_GRACE_MS,
  GameError,
  MAX_SPEED_BONUS,
  SESSION_RETENTION_MS,
  WAITING_TIMEOUT_MS,
  type GameNotifier,
  type LiveStats,
  type Player,
  type Session,
} from './game.types.js';

interface QueueEntry {
  socketId: string;
  name: string;
}

const RUNNING_PHASES = new Set(['countdown', 'question', 'reveal']);

/**
 * Server-authoritative game engine. Owns all sessions, timers and scoring;
 * the gateway only translates socket messages into calls on this service.
 */
@Injectable()
export class GameService implements OnApplicationShutdown {
  private readonly logger = new Logger(GameService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly socketToPlayer = new Map<string, string>();
  private readonly players = new Map<string, { player: Player; session: Session }>();
  private readonly tokens = new Map<string, string>();
  private queue: QueueEntry[] = [];
  private notifier: GameNotifier | null = null;

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
    private readonly statsService: StatsService,
  ) {}

  attachNotifier(notifier: GameNotifier): void {
    this.notifier = notifier;
  }

  onApplicationShutdown(): void {
    for (const session of this.sessions.values()) {
      this.clearTimers(session);
    }
    this.sessions.clear();
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  async createFriendGame(socketId: string, name: string): Promise<void> {
    this.leaveEverything(socketId);
    await this.assertEnoughQuestions();
    this.leaveEverything(socketId);

    const session = this.createSession('friend');
    this.addPlayer(session, socketId, name);
    session.phase = 'waiting';
    this.setTimer(session, WAITING_TIMEOUT_MS, () => this.removeSession(session));
    this.logger.log(`Friend game ${session.code} created`);
    this.broadcast(session);
  }

  joinFriendGame(socketId: string, code: string, name: string): void {
    const session = this.sessions.get(code);
    if (!session || session.mode !== 'friend') {
      throw new GameError('GAME_NOT_FOUND');
    }
    if (session.players.some((player) => player.socketId === socketId)) {
      throw new GameError('OWN_GAME');
    }
    if (session.phase !== 'waiting' || session.players.length >= 2) {
      throw new GameError('GAME_FULL');
    }

    this.leaveEverything(socketId);
    this.addPlayer(session, socketId, name);
    this.logger.log(`Player joined friend game ${session.code}`);
    this.startCountdown(session);
  }

  /** Matches the player with someone from the queue, or queues them. */
  async startMatchmaking(
    socketId: string,
    name: string,
  ): Promise<'matched' | 'queued'> {
    this.leaveEverything(socketId);
    await this.assertEnoughQuestions();
    this.leaveEverything(socketId);

    const opponent = this.queue.shift();
    if (!opponent) {
      this.queue.push({ socketId, name });
      return 'queued';
    }

    const session = this.createSession('quick');
    this.addPlayer(session, opponent.socketId, opponent.name);
    this.addPlayer(session, socketId, name);
    this.logger.log(`Quick game ${session.code} matched`);
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

    player.rematchRequested = true;
    if (session.players.every((p) => p.rematchRequested)) {
      this.restart(session);
    } else {
      this.broadcast(session);
    }
  }

  leave(socketId: string): void {
    this.leaveEverything(socketId);
  }

  resume(socketId: string, sessionToken: string): void {
    const playerId = this.tokens.get(sessionToken);
    const entry = playerId ? this.players.get(playerId) : undefined;
    if (!entry || !this.sessions.has(entry.session.code)) {
      throw new GameError('SESSION_NOT_FOUND');
    }

    const { player, session } = entry;
    if (player.socketId && player.socketId !== socketId) {
      this.socketToPlayer.delete(player.socketId);
    }
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    player.socketId = socketId;
    this.socketToPlayer.set(socketId, player.id);
    this.broadcast(session);
  }

  /**
   * A lost connection keeps the player in the game for a grace period so a
   * reload or a short network gap does not end the duel. `closedByPage` marks
   * a connection the page closed itself while unloading.
   */
  handleDisconnect(socketId: string, closedByPage = false): void {
    this.cancelMatchmaking(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    this.socketToPlayer.delete(socketId);
    const entry = playerId ? this.players.get(playerId) : undefined;
    if (!entry || entry.player.socketId !== socketId) {
      return;
    }

    const { player, session } = entry;
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
    let activeGames = 0;
    let playersInGames = 0;
    for (const session of this.sessions.values()) {
      if (RUNNING_PHASES.has(session.phase)) {
        activeGames++;
        playersInGames += session.players.length;
      }
    }
    return { activeGames, playersInGames, playersSearching: this.queue.length };
  }

  /** Builds the personalised snapshot for one player. */
  buildView(session: Session, player: Player): GameStateView {
    const opponent =
      session.players.find((p) => p.id !== player.id) ??
      session.departed.find((p) => p.id !== player.id) ??
      null;
    const question =
      session.phase === 'question' || session.phase === 'reveal'
        ? session.questions[session.questionIndex]
        : undefined;
    const reveal = session.phase === 'reveal' ? session.lastReveal : null;

    return {
      gameCode: session.code,
      sessionToken: player.sessionToken,
      mode: session.mode,
      phase: session.phase,
      endReason: session.endReason,
      you: this.toPlayerView(player),
      opponent: opponent ? this.toPlayerView(opponent) : null,
      questionNumber: Math.min(
        session.questionIndex + 1,
        Math.max(session.questions.length, 1),
      ),
      totalQuestions: session.questions.length || session.settings.questionsPerGame,
      question: question
        ? {
            index: session.questionIndex,
            text: question.text,
            options: question.options,
          }
        : null,
      reveal: reveal
        ? {
            correctIndex: reveal.correctIndex,
            yourAnswerIndex: reveal.answers.get(player.id) ?? null,
            opponentAnswerIndex: opponent
              ? (reveal.answers.get(opponent.id) ?? null)
              : null,
            yourPoints: reveal.points.get(player.id) ?? 0,
            opponentPoints: opponent ? (reveal.points.get(opponent.id) ?? 0) : 0,
          }
        : null,
      phaseEndsAt: session.phaseEndsAt,
      phaseDurationMs:
        session.phaseEndsAt !== null
          ? session.phaseEndsAt - session.phaseStartedAt
          : null,
      serverNow: Date.now(),
      rematchAvailable: this.isRematchAvailable(session),
    };
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
    this.enterPhase(session, 'countdown', COUNTDOWN_MS, () =>
      this.startQuestion(session),
    );

    this.questionsService
      .pickRandom(session.settings.questionsPerGame)
      .then((questions) => {
        if (session.generation !== generation || !this.sessions.has(session.code)) {
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
    const durationMs = session.settings.questionDurationSec * 1000;
    const answers = new Map<string, number | null>();
    const points = new Map<string, number>();

    for (const player of session.players) {
      const correct = player.answerIndex === question.correctIndex;
      const earned = correct
        ? this.calculatePoints(session, player.answerTimeMs, durationMs)
        : 0;
      player.score += earned;
      player.lastPoints = earned;
      answers.set(player.id, player.answerIndex);
      points.set(player.id, earned);
    }

    session.lastReveal = { correctIndex: question.correctIndex, answers, points };
    this.recordQuestionResult(session, question.id, answers, question.correctIndex);

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
    void this.statsService.recordGame(session.mode, session.questions.length);
    // Both modes offer a rematch against the same opponent for a while.
    const rematchMs = session.settings.rematchTimeoutSec * 1000;
    this.enterPhase(session, 'finished', rematchMs, () =>
      this.expireRematch(session),
    );
  }

  private expireRematch(session: Session): void {
    if (session.players.some((player) => player.rematchRequested)) {
      session.endReason = 'rematch-declined';
    }
    session.phaseEndsAt = null;
    this.setTimer(session, SESSION_RETENTION_MS, () => this.removeSession(session));
    this.broadcast(session);
  }

  private restart(session: Session): void {
    this.logger.log(`Rematch in game ${session.code}`);
    this.startCountdown(session);
  }

  private abort(session: Session, reason: EndReason): void {
    session.endReason = reason;
    this.enterPhase(session, 'aborted', null, null);
    this.setTimer(session, SESSION_RETENTION_MS, () => this.removeSession(session));
  }

  private calculatePoints(
    session: Session,
    answerTimeMs: number | null,
    durationMs: number,
  ) {
    if (!session.settings.speedBonusEnabled) {
      return BASE_POINTS;
    }
    const remainingMs = Math.max(0, durationMs - (answerTimeMs ?? durationMs));
    return BASE_POINTS + Math.round(MAX_SPEED_BONUS * (remainingMs / durationMs));
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

  // ---------------------------------------------------------------------------
  // Session and player bookkeeping
  // ---------------------------------------------------------------------------

  private createSession(mode: GameMode): Session {
    const settings = this.settingsService.get();
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
      phaseStartedAt: Date.now(),
      phaseEndsAt: null,
      timer: null,
      lastReveal: null,
      generation: 0,
    };
    this.sessions.set(session.code, session);
    return session;
  }

  private addPlayer(session: Session, socketId: string, name: string): Player {
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
    this.players.set(player.id, { player, session });
    this.tokens.set(player.sessionToken, player.id);
    this.socketToPlayer.set(socketId, player.id);
    return player;
  }

  /** Removes a player from their session and informs the opponent. */
  private removePlayer(session: Session, player: Player, reason: EndReason): void {
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }
    session.players = session.players.filter((p) => p.id !== player.id);
    session.departed.push({ ...player, socketId: null, disconnectTimer: null });
    this.forgetPlayer(player);

    if (session.players.length === 0 || session.phase === 'waiting') {
      this.removeSession(session);
      return;
    }

    if (RUNNING_PHASES.has(session.phase)) {
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
    this.clearTimers(session);
    for (const player of session.players) {
      this.forgetPlayer(player);
    }
    session.players = [];
    if (this.sessions.delete(session.code)) {
      this.logger.log(`Game ${session.code} removed`);
    }
  }

  private forgetPlayer(player: Player): void {
    this.players.delete(player.id);
    this.tokens.delete(player.sessionToken);
    if (player.socketId && this.socketToPlayer.get(player.socketId) === player.id) {
      this.socketToPlayer.delete(player.socketId);
    }
  }

  /** Removes a socket from the queue and from any game it is part of. */
  private leaveEverything(socketId: string): void {
    this.cancelMatchmaking(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    const entry = playerId ? this.players.get(playerId) : undefined;
    if (entry) {
      this.removePlayer(entry.session, entry.player, 'opponent-left');
    }
  }

  private requirePlayer(socketId: string): { session: Session; player: Player } {
    const playerId = this.socketToPlayer.get(socketId);
    const entry = playerId ? this.players.get(playerId) : undefined;
    if (!entry) {
      throw new GameError('NOT_IN_GAME');
    }
    return entry;
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
      this.clearSessionTimer(session);
    }
    this.broadcast(session);
  }

  private setTimer(session: Session, delayMs: number, callback: () => void): void {
    this.clearSessionTimer(session);
    session.timer = setTimeout(() => {
      session.timer = null;
      try {
        callback();
      } catch (error) {
        this.logger.error(`Timer failed in game ${session.code}: ${String(error)}`);
      }
    }, delayMs);
  }

  private clearSessionTimer(session: Session): void {
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = null;
    }
  }

  private clearTimers(session: Session): void {
    this.clearSessionTimer(session);
    for (const player of session.players) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
    }
  }

  private broadcast(session: Session): void {
    if (!this.notifier) {
      return;
    }
    for (const player of session.players) {
      if (player.socketId) {
        this.notifier.sendState(player.socketId, this.buildView(session, player));
      }
    }
  }

  private toPlayerView(player: Player): PlayerView {
    return {
      name: player.name,
      score: player.score,
      connected: player.socketId !== null,
      hasAnswered: player.answerIndex !== null,
      rematchRequested: player.rematchRequested,
    };
  }

  private recordQuestionResult(
    session: Session,
    questionId: number,
    answers: Map<string, number | null>,
    correctIndex: number,
  ): void {
    const values = [...answers.values()].filter((answer) => answer !== null);
    const result: QuestionResult = {
      questionId,
      answers: values.length,
      correctAnswers: values.filter((answer) => answer === correctIndex).length,
    };
    if (result.answers === 0) {
      return;
    }
    this.questionsService.recordResults([result]).catch((error: unknown) => {
      this.logger.error(
        `Could not record question stats for ${session.code}: ${String(error)}`,
      );
    });
  }
}
