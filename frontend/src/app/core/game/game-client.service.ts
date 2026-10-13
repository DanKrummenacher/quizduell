import { computed, Injectable, type OnDestroy, signal } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {
  type Ack,
  ClientEvents,
  type GameStateView,
  type MatchmakingStatus,
  ServerEvents,
} from '../contracts/game.contract';
import { sessionStore } from '../platform/safe-storage';
import type { ClientErrorCode } from './error-messages';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export type CommandResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ClientErrorCode };

const TOKEN_KEY = 'playduelio.sessionToken';
const CONNECT_TIMEOUT_MS = 20_000;
const ACK_TIMEOUT_MS = 10_000;
const FINAL_PHASES = new Set(['finished', 'aborted']);

/**
 * Single connection to the game server. Holds the latest game snapshot as a
 * signal and resumes a running game automatically after reconnects or reloads.
 */
@Injectable({ providedIn: 'root' })
export class GameClient implements OnDestroy {
  private socket: Socket | null = null;
  private readonly stateSignal = signal<GameStateView | null>(null);
  private readonly statusSignal = signal<ConnectionStatus>('idle');
  private readonly searchingSignal = signal(false);
  private readonly resumingSignal = signal(false);
  private clockOffsetMs = 0;
  private matchmakingName: string | null = null;

  /** Latest snapshot of the current game, `null` when not in a game. */
  readonly state = this.stateSignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  /** True while waiting in the quick game queue. */
  readonly searching = this.searchingSignal.asReadonly();
  /** True while trying to resume a game after a reload. */
  readonly resuming = this.resumingSignal.asReadonly();
  readonly inGame = computed(() => this.stateSignal() !== null);

  constructor() {
    if (sessionStore.get(TOKEN_KEY)) {
      // A game was running in this tab before a reload: try to get back into it.
      this.resumingSignal.set(true);
      this.ensureSocket().connect();
    }
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }

  /** Current time on the server clock, corrected for device clock drift. */
  serverNow(): number {
    return Date.now() + this.clockOffsetMs;
  }

  createGame(playerName: string): Promise<CommandResult> {
    return this.command(ClientEvents.CREATE_GAME, { playerName });
  }

  joinGame(gameCode: string, playerName: string): Promise<CommandResult> {
    return this.command(ClientEvents.JOIN_GAME, { gameCode, playerName });
  }

  async startMatchmaking(
    playerName: string,
  ): Promise<CommandResult<MatchmakingStatus>> {
    this.searchingSignal.set(true);
    this.matchmakingName = playerName;
    const result = await this.command<MatchmakingStatus>(
      ClientEvents.START_MATCHMAKING,
      {
        playerName,
      },
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
    return this.command(ClientEvents.SUBMIT_ANSWER, { questionIndex, answerIndex });
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

  private async command<T = undefined>(
    event: string,
    payload?: unknown,
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
      this.statusSignal.set('connected');
      void this.resumeIfNeeded();
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
    if (FINAL_PHASES.has(state.phase)) {
      // Nothing to resume once the game is over.
      sessionStore.remove(TOKEN_KEY);
    } else {
      sessionStore.set(TOKEN_KEY, state.sessionToken);
    }
  }

  private async resumeIfNeeded(): Promise<void> {
    const current = this.stateSignal();
    const token =
      current && !FINAL_PHASES.has(current.phase)
        ? current.sessionToken
        : sessionStore.get(TOKEN_KEY);
    if (!token || !this.socket) {
      this.resumingSignal.set(false);
      this.requeueIfSearching();
      return;
    }

    try {
      const ack = (await this.socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(ClientEvents.RESUME, { sessionToken: token })) as Ack;
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
      this.socket.emit(ClientEvents.START_MATCHMAKING, {
        playerName: this.matchmakingName,
      });
    }
  }

  /** The server no longer knows our game (e.g. it was restarted). */
  private handleLostGame(): void {
    const current = this.stateSignal();
    sessionStore.remove(TOKEN_KEY);
    if (current && !FINAL_PHASES.has(current.phase)) {
      this.stateSignal.set({
        ...current,
        phase: 'aborted',
        endReason: 'expired',
        phaseEndsAt: null,
        rematchAvailable: false,
      });
    }
  }

  private forgetGame(): void {
    sessionStore.remove(TOKEN_KEY);
    this.stateSignal.set(null);
  }
}
