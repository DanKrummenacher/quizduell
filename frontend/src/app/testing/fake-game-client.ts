import { signal } from '@angular/core';
import type { GameStateView, PlayerView } from '../core/contracts/game.contract';
import type {
  CommandResult,
  ConnectionStatus,
} from '../core/game/game-client.service';

/** Test double for GameClient with writable signals and recorded commands. */
export class FakeGameClient {
  readonly state = signal<GameStateView | null>(null);
  readonly status = signal<ConnectionStatus>('connected');
  readonly searching = signal(false);
  readonly resuming = signal(false);
  readonly inGame = () => this.state() !== null;
  readonly calls: string[] = [];

  serverNow(): number {
    return 0;
  }

  private record<T>(name: string, data?: T): Promise<CommandResult<T>> {
    this.calls.push(name);
    return Promise.resolve({ ok: true, data: data as T });
  }

  createGame = () => this.record('createGame');
  joinGame = (code: string) => this.record(`joinGame:${code}`);
  startMatchmaking = () => this.record('startMatchmaking', 'queued' as const);
  cancelMatchmaking = () => this.record('cancelMatchmaking').then(() => undefined);
  submitAnswer = (question: number, answer: number) =>
    this.record(`answer:${question}:${answer}`);
  requestRematch = () => this.record('rematch');
  leave = () => {
    this.calls.push('leave');
    this.state.set(null);
  };
}

export function player(
  name: string,
  score = 0,
  extra: Partial<PlayerView> = {},
): PlayerView {
  return {
    name,
    score,
    connected: true,
    hasAnswered: false,
    rematchRequested: false,
    ...extra,
  };
}

export function gameState(overrides: Partial<GameStateView> = {}): GameStateView {
  return {
    gameCode: 'K7QX',
    sessionToken: 'token',
    mode: 'friend',
    phase: 'question',
    endReason: null,
    you: player('Anna'),
    opponent: player('Ben'),
    questionNumber: 1,
    totalQuestions: 7,
    question: {
      index: 0,
      text: 'Wie viele Kantone hat die Schweiz?',
      options: ['23', '24', '26', '28'],
    },
    reveal: null,
    phaseEndsAt: 20_000,
    phaseDurationMs: 20_000,
    serverNow: 0,
    rematchAvailable: false,
    ...overrides,
  };
}
