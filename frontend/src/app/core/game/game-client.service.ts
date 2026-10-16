import { computed, Injectable, type OnDestroy, signal } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {
  type Ack,
  ClientEvents,
  type CreateGameRequest,
  type GameStateView,
  type JoinGameRequest,
  type LeaveGameRequest,
  type MatchmakingStatus,
  type ResumeRequest,
  ServerEvents,
  type StartMatchmakingRequest,
  type SubmitAnswerRequest,
} from '../contracts/game.contract';
import { sessionStore } from '../platform/safe-storage';
import type { ClientErrorCode } from './error-messages';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export type CommandResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ClientErrorCode };

/** The game of this browser tab, kept across reloads (session storage). */
const TOKEN_KEY = 'playduelio.sessionToken';
const CONNECT_TIMEOUT_MS = 20_000;
const ACK_TIMEOUT_MS = 10_000;

/**
 * Single connection to the game server. Sends commands, holds the latest game
 * snapshot as a signal and resumes the game after a lost connection. When a
 * game is resumed or left is decided by `GameLifecycleService`.
 */
@Injectable({ providedIn: 'root' })
export class GameClient implements OnDestroy {
  private socket: Socket | null = null;
  private readonly stateSignal = signal<GameStateView | null>(null);
  private readonly statusSignal = signal<ConnectionStatus>('idle');
  private readonly searchingSignal = signal(false);
  // A stored game is pending until the lifecycle resumes or leaves it, so
  // game screens wait instead of redirecting away.
  private readonly resumingSignal = signal(this.hasStoredGame());
  private clockOffsetMs = 0;
  private matchmakingName: string | null = null;
  private connectedBefore = false;

  /** Latest snapshot of the current game, `null` when not in a game. */
  readonly state = this.stateSignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  /** True while waiting in the quick game queue. */
  readonly searching = this.searchingSignal.asReadonly();
  /** True while a game from an earlier page load is being resumed. */
  readonly resuming = this.resumingSignal.asReadonly();
  readonly inGame = computed(() => this.stateSignal() !== null);

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }

  /** Current time on the server clock, corrected for device clock drift. */
  serverNow(): number {
    return Date.now() + this.clockOffsetMs;
  }

  createGame(playerName: string): Promise<CommandResult> {
    const request: CreateGameRequest = { playerName };
    return this.command(ClientEvents.CREATE_GAME, request);
  }

  joinGame(gameCode: string, playerName: string): Promise<CommandResult> {
    const request: JoinGameRequest = { gameCode, playerName };
    return this.command(ClientEvents.JOIN_GAME, request);
  }

  async startMatchmaking(
    playerName: string,
  ): Promise<CommandResult<MatchmakingStatus>> {
    this.searchingSignal.set(true);
    this.matchmakingName = playerName;
    const request: StartMatchmakingRequest = { playerName };
    const result = await this.command<MatchmakingStatus>(
      ClientEvents.START_MATCHMAKING,
      request,
    );
    if (!result.ok || result.data === 'matched') {
      this.searchingSignal.set(false);
    }
    return result;
  }

  async cancelMatchmaking(): Promise<void> {
    this.searchingSignal.set(false);
    this.matchmakingName = null;
    if (this.socket?.connected) {
      await this.command(ClientEvents.CANCEL_MATCHMAKING);
    }
  }

  submitAnswer(questionIndex: number, answerIndex: number): Promise<CommandResult> {
    const request: SubmitAnswerRequest = { questionIndex, answerIndex };
    return this.command(ClientEvents.SUBMIT_ANSWER, request);
  }

  requestRematch(): Promise<CommandResult> {
    return this.command(ClientEvents.REQUEST_REMATCH);
  }

  /** Leaves the current game (or queue) and forgets it locally. */
  leave(): void {
    if (this.socket?.connected) {
      this.socket.emit(ClientEvents.LEAVE_GAME);
    }
    this.searchingSignal.set(false);
    this.matchmakingName = null;
    this.forgetGame();
  }

  /** Whether this tab holds a game from an earlier page load. */
  hasStoredGame(): boolean {
    return sessionStore.get(TOKEN_KEY) !== null;
  }

  /** Gets back into the stored game; the connect handler sends the resume. */
  resumeStoredGame(): void {
    this.resumingSignal.set(true);
    this.ensureSocket().connect();
  }

  /** Leaves the stored game without resuming it, so the opponent is informed. */
  async leaveStoredGame(): Promise<void> {
    const sessionToken = sessionStore.get(TOKEN_KEY);
    sessionStore.remove(TOKEN_KEY);
    this.resumingSignal.set(false);
    if (sessionToken !== null) {
      const request: LeaveGameRequest = { sessionToken };
      await this.command(ClientEvents.LEAVE_GAME, request);
    }
  }

  /**
   * Closes the connection on purpose while the page unloads. The server then
   * keeps the game only briefly, long enough for a reload.
   */
  suspend(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }

  /** Reconnects after `suspend` when the page is shown again (page cache). */
  reconnect(): void {
    if (this.hasStoredGame() || this.searchingSignal()) {
      this.ensureSocket().connect();
    }
  }

  private async command<T = undefined>(
    event: string,
    payload?: object,
  ): Promise<CommandResult<T>> {
    const connected = await this.connect();
    if (!connected || !this.socket) {
      return { ok: false, error: 'CONNECTION_FAILED' };
    }
    try {
      const emitter = this.socket.timeout(ACK_TIMEOUT_MS);
      const ack = (await (payload === undefined
        ? emitter.emitWithAck(event)
        : emitter.emitWithAck(event, payload))) as Ack<T>;
      return ack.ok ? { ok: true, data: ack.data } : { ok: false, error: ack.error };
    } catch {
      return { ok: false, error: 'TIMEOUT' };
    }
  }

  /** Resolves once connected; false if the server could not be reached in time. */
  private connect(): Promise<boolean> {
    const socket = this.ensureSocket();
    if (socket.connected) {
      return Promise.resolve(true);
    }
    socket.connect();
    return new Promise((resolve) => {
      const timer = setTimeout(() => finish(false), CONNECT_TIMEOUT_MS);
      const onConnect = () => finish(true);
      const finish = (result: boolean) => {
        clearTimeout(timer);
        socket.off('connect', onConnect);
        resolve(result);
      };
      socket.on('connect', onConnect);
    });
  }

  private ensureSocket(): Socket {
    if (this.socket) {
      return this.socket;
    }

    const socket = io(environment.apiUrl, {
      autoConnect: false,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3_000,
      timeout: CONNECT_TIMEOUT_MS,
    });

    socket.on('connect', () => {
      const isReconnect = this.connectedBefore;
      this.connectedBefore = true;
      this.statusSignal.set('connected');
      void this.resumeIfNeeded(isReconnect);
    });
    socket.on('disconnect', (reason) => {
      // Reconnect unless we closed the connection on purpose.
      this.statusSignal.set(
        reason === 'io client disconnect' ? 'idle' : 'reconnecting',
      );
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });
    socket.io.on('reconnect_attempt', () => this.statusSignal.set('reconnecting'));
    socket.on('connect_error', () => {
      if (this.statusSignal() !== 'reconnecting') {
        this.statusSignal.set('connecting');
      }
    });
    socket.on(ServerEvents.STATE, (state: GameStateView) => this.applyState(state));

    this.statusSignal.set('connecting');
    this.socket = socket;
    return socket;
  }

  private applyState(state: GameStateView): void {
    this.clockOffsetMs = state.serverNow - Date.now();
    this.searchingSignal.set(false);
    this.resumingSignal.set(false);
    this.stateSignal.set(state);
    if (state.phase === 'aborted') {
      // Nothing to resume once the game was aborted. Finished games stay
      // resumable for the rematch.
      sessionStore.remove(TOKEN_KEY);
    } else {
      sessionStore.set(TOKEN_KEY, state.sessionToken);
    }
  }

  private async resumeIfNeeded(isReconnect: boolean): Promise<void> {
    const sessionToken = sessionStore.get(TOKEN_KEY);
    if (!sessionToken || !this.socket) {
      this.resumingSignal.set(false);
      if (isReconnect) {
        // Only after a lost connection: the first connect is made by the
        // matchmaking command itself, which would otherwise run twice.
        this.requeueIfSearching();
      }
      return;
    }

    try {
      const request: ResumeRequest = { sessionToken };
      const ack = (await this.socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(ClientEvents.RESUME, request)) as Ack;
      if (!ack.ok) {
        this.handleLostGame();
      }
    } catch {
      // The next reconnect will try again.
    } finally {
      this.resumingSignal.set(false);
    }
  }

  /** The server forgets queued players on disconnect; join the queue again. */
  private requeueIfSearching(): void {
    if (this.searchingSignal() && this.matchmakingName && this.socket) {
      const request: StartMatchmakingRequest = { playerName: this.matchmakingName };
      this.socket.emit(ClientEvents.START_MATCHMAKING, request);
    }
  }

  /** The server no longer knows our game (e.g. it was restarted). */
  private handleLostGame(): void {
    const current = this.stateSignal();
    sessionStore.remove(TOKEN_KEY);
    if (current?.phase === 'finished') {
      // The result stays visible, only the rematch is gone.
      this.stateSignal.set({ ...current, phaseEndsAt: null, rematch: 'expired' });
    } else if (current && current.phase !== 'aborted') {
      this.stateSignal.set({
        ...current,
        phase: 'aborted',
        endReason: 'expired',
        phaseEndsAt: null,
      });
    }
  }

  private forgetGame(): void {
    sessionStore.remove(TOKEN_KEY);
    this.stateSignal.set(null);
  }
}
