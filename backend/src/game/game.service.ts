import {
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type {
  LiveDuel,
  LiveEvent,
  LiveSample,
  LiveSnapshot,
} from '../contracts/admin.contract.js';
import type {
  EndReason,
  GameMode,
  GameStateView,
  PlayerView,
  RematchStatus,
} from '../contracts/game.contract.js';
import {
  type GameQuestion,
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
  LIVE_EVENT_LIMIT,
  LIVE_HISTORY_MINUTES,
  LIVE_SAMPLE_MS,
  GameError,
  MAX_SPEED_BONUS,
  SESSION_RETENTION_MS,
  WAITING_TIMEOUT_MS,
  type GameNotifier,
  type LiveStats,
  type Player,
  type RoundRecord,
  type Session,
} from './game.types.js';

interface QueueEntry {
  socketId: string;
  name: string;
  since: number;
}

const RUNNING_PHASES = new Set(['countdown', 'question', 'reveal']);

/**
 * Server-authoritative game engine. Owns all sessions, timers and scoring;
 * the gateway only translates socket messages into calls on this service.
 */
@Injectable()
export class GameService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(GameService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly socketToPlayer = new Map<string, string>();
  private readonly players = new Map<string, { player: Player; session: Session }>();
  private readonly tokens = new Map<string, string>();
  private queue: QueueEntry[] = [];
  private notifier: GameNotifier | null = null;
  private readonly startedAt = Date.now();
  private events: LiveEvent[] = [];
  private eventId = 0;
  private history: LiveSample[] = [];
  private peak: { games: number; at: number } | null = null;
  private sampler: NodeJS.Timeout | null = null;

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
    private readonly statsService: StatsService,
  ) {}

  attachNotifier(notifier: GameNotifier): void {
    this.notifier = notifier;
  }

  onModuleInit(): void {
    this.sampler = setInterval(() => this.sample(), LIVE_SAMPLE_MS);
    this.sampler.unref();
  }

  onApplicationShutdown(): void {
    if (this.sampler) {
      clearInterval(this.sampler);
    }
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
    this.assertOpen();
    await this.assertEnoughQuestions();
    this.leaveEverything(socketId);

    const session = this.createSession('friend');
    this.addPlayer(session, socketId, name);
    session.phase = 'waiting';
    this.setTimer(session, WAITING_TIMEOUT_MS, () => {
      this.event(session, 'expired');
      this.removeSession(session);
    });
    this.logger.log(`Friend game ${session.code} created`);
    this.event(session, 'created');
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
    this.assertOpen();

    this.leaveEverything(socketId);
    this.addPlayer(session, socketId, name);
    this.logger.log(`Player joined friend game ${session.code}`);
    this.event(session, 'joined');
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

    const session = this.createSession('quick');
    this.addPlayer(session, opponent.socketId, opponent.name);
    this.addPlayer(session, socketId, name);
    this.logger.log(`Quick game ${session.code} matched`);
    this.event(session, 'matched');
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
    const entry = this.findByToken(sessionToken);
    if (entry) {
      this.removePlayer(entry.session, entry.player, 'opponent-left');
    }
  }

  resume(socketId: string, sessionToken: string): void {
    const entry = this.findByToken(sessionToken);
    if (!entry) {
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

  /** Everything the admin shows on its live page. */
  getLiveSnapshot(): LiveSnapshot {
    const now = Date.now();
    const duels: LiveDuel[] = [];
    const waiting: LiveSnapshot['waiting'] = [];
    for (const session of this.sessions.values()) {
      if (session.phase === 'waiting') {
        waiting.push({
          code: session.code,
          name: session.players[0]?.name ?? '',
          since: session.phaseStartedAt,
        });
      } else if (
        RUNNING_PHASES.has(session.phase) ||
        (session.phase === 'finished' && session.phaseEndsAt !== null)
      ) {
        duels.push(this.toLiveDuel(session));
      }
    }
    duels.sort((a, b) => a.startedAt - b.startedAt);
    return {
      serverNow: now,
      since: this.startedAt,
      duels,
      searching: this.queue.map((entry) => ({
        name: entry.name,
        since: entry.since,
      })),
      waiting: waiting.sort((a, b) => a.since - b.since),
      events: [...this.events].reverse(),
      history: this.historyWindow(now),
      peak: this.peak,
      paused: this.settingsService.isPaused(),
    };
  }

  private toLiveDuel(session: Session): LiveDuel {
    const people = [...session.players, ...session.departed];
    const question =
      session.phase === 'question' || session.phase === 'reveal'
        ? session.questions[session.questionIndex]
        : undefined;
    return {
      code: session.code,
      mode: session.mode,
      phase: session.phase,
      players: people.map((player) => ({
        name: player.name,
        score: player.score,
        connected: player.socketId !== null,
        answered: player.answerIndex !== null,
      })),
      questionNumber: Math.min(
        session.questionIndex + 1,
        Math.max(session.questions.length, 1),
      ),
      totalQuestions: session.questions.length || session.settings.questionsPerGame,
      currentQuestion: question?.text ?? null,
      phaseEndsAt: session.phaseEndsAt,
      startedAt: session.startedAt,
      rematch: session.rematch,
      rounds: session.rounds.map((round) => ({
        questionId: round.questionId,
        text: round.text,
        options: round.options,
        correctIndex: round.correctIndex,
        answers: people.map(
          (player) =>
            round.answers.get(player.id) ?? { index: null, ms: null, points: 0 },
        ),
      })),
    };
  }

  /** The last hour, one sample per minute, gaps filled with zero. */
  private historyWindow(now: number): LiveSample[] {
    const minute = Math.floor(now / 60_000) * 60_000;
    const byMinute = new Map(this.history.map((sample) => [sample.at, sample]));
    const samples: LiveSample[] = [];
    for (let i = LIVE_HISTORY_MINUTES - 1; i >= 0; i--) {
      const at = minute - i * 60_000;
      samples.push(byMinute.get(at) ?? { at, games: 0, players: 0 });
    }
    return samples;
  }

  /** Keeps the highest load of each minute. */
  private sample(): void {
    const now = Date.now();
    const at = Math.floor(now / 60_000) * 60_000;
    const { activeGames, playersInGames } = this.getLiveStats();
    const last = this.history.at(-1);
    if (last?.at === at) {
      last.games = Math.max(last.games, activeGames);
      last.players = Math.max(last.players, playersInGames);
    } else {
      this.history.push({ at, games: activeGames, players: playersInGames });
      const oldest = at - LIVE_HISTORY_MINUTES * 60_000;
      this.history = this.history.filter((sample) => sample.at > oldest);
    }
    if (activeGames > 0 && activeGames > (this.peak?.games ?? 0)) {
      this.peak = { games: activeGames, at: now };
    }
  }

  private event(
    session: Session,
    kind: LiveEvent['kind'],
    extra: Pick<LiveEvent, 'scores' | 'reason'> = {},
  ): void {
    this.events.push({
      id: ++this.eventId,
      at: Date.now(),
      kind,
      code: session.code,
      mode: session.mode,
      names: [...session.players, ...session.departed].map((player) => player.name),
      ...extra,
    });
    if (this.events.length > LIVE_EVENT_LIMIT) {
      this.events = this.events.slice(-LIVE_EVENT_LIMIT);
    }
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
      rematch: this.rematchStatus(session, player),
    };
  }

  private rematchStatus(session: Session, player: Player): RematchStatus | null {
    if (session.phase !== 'finished') {
      return null;
    }
    if (
      session.endReason === 'opponent-left' ||
      session.endReason === 'opponent-disconnected'
    ) {
      return 'opponent-left';
    }
    if (session.phaseEndsAt === null) {
      // The rematch window has closed.
      return player.rematchRequested ? 'unanswered' : 'expired';
    }
    const opponent = session.players.find((p) => p.id !== player.id);
    if (!opponent?.socketId || !player.socketId) {
      return 'paused';
    }
    if (player.rematchRequested) {
      return 'requested';
    }
    return opponent.rematchRequested ? 'offered' : 'open';
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
    const round: RoundRecord = {
      questionId: question.id,
      text: question.text,
      options: question.options,
      correctIndex: question.correctIndex,
      answers: new Map(),
    };

    for (const player of session.players) {
      const correct = player.answerIndex === question.correctIndex;
      const earned = correct
        ? this.calculatePoints(session, player.answerTimeMs, durationMs)
        : 0;
      player.score += earned;
      player.lastPoints = earned;
      answers.set(player.id, player.answerIndex);
      points.set(player.id, earned);
      round.answers.set(player.id, {
        index: player.answerIndex,
        ms: player.answerIndex === null ? null : player.answerTimeMs,
        points: earned,
      });
    }

    session.lastReveal = { correctIndex: question.correctIndex, answers, points };
    session.rounds.push(round);
    this.recordQuestionResult(session, question);

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
    this.event(session, 'finished', {
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
    this.event(session, 'rematch');
    this.startCountdown(session);
  }

  private abort(session: Session, reason: EndReason): void {
    session.endReason = reason;
    this.recordGame(session, 'aborted');
    this.event(session, 'aborted', { reason });
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
      startedAt: Date.now(),
      rematch: false,
      rounds: [],
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

  private findByToken(
    sessionToken: string,
  ): { session: Session; player: Player } | undefined {
    const playerId = this.tokens.get(sessionToken);
    const entry = playerId ? this.players.get(playerId) : undefined;
    return entry && this.sessions.has(entry.session.code) ? entry : undefined;
  }

  private requirePlayer(socketId: string): { session: Session; player: Player } {
    const playerId = this.socketToPlayer.get(socketId);
    const entry = playerId ? this.players.get(playerId) : undefined;
    if (!entry) {
      throw new GameError('NOT_IN_GAME');
    }
    return entry;
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

  private recordGame(session: Session, status: 'finished' | 'aborted'): void {
    const people = [...session.players, ...session.departed];
    void this.statsService.recordGame({
      mode: session.mode,
      status,
      endReason: status === 'aborted' ? session.endReason : null,
      questionCount: session.questions.length || session.settings.questionsPerGame,
      questionsPlayed: session.rounds.length,
      rematch: session.rematch,
      durationMs: Date.now() - session.startedAt,
      scores: people.map((player) => player.score),
    });
  }

  /** Counts picks in the stored order of the question, not the shuffled one. */
  private recordQuestionResult(session: Session, question: GameQuestion): void {
    const result: QuestionResult = {
      questionId: question.id,
      picks: question.options.map(() => 0),
      correct: 0,
      timeouts: 0,
      answerMsTotal: 0,
    };
    for (const player of session.players) {
      if (player.answerIndex === null) {
        result.timeouts++;
        continue;
      }
      const stored = question.order[player.answerIndex] ?? player.answerIndex;
      result.picks[stored] = (result.picks[stored] ?? 0) + 1;
      result.answerMsTotal += player.answerTimeMs ?? 0;
      if (player.answerIndex === question.correctIndex) {
        result.correct++;
      }
    }
    this.questionsService.recordResults([result]).catch((error: unknown) => {
      this.logger.error(
        `Could not record question stats for ${session.code}: ${String(error)}`,
      );
    });
  }
}
