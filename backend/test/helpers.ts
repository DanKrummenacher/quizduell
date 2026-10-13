import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { configureApp } from '../src/app.factory.js';
import { AppModule } from '../src/app.module.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import {
  type Ack,
  type GameStateView,
  ServerEvents,
} from '../src/contracts/game.contract.js';

export const ADMIN_PASSWORD = 'test-admin-password';

export interface TestApp {
  app: INestApplication;
  url: string;
  close: () => Promise<void>;
}

export async function startTestApp(): Promise<TestApp> {
  const config: AppConfig = {
    port: 0,
    production: false,
    databaseUrl: '',
    corsOrigins: ['http://localhost:4200'],
    adminPassword: ADMIN_PASSWORD,
    jwtSecret: 'test-jwt-secret',
  };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(APP_CONFIG)
    .useValue(config)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  return { app, url: url.replace('[::1]', '127.0.0.1'), close: () => app.close() };
}

export class TestPlayer {
  readonly socket: Socket;
  readonly states: GameStateView[] = [];

  constructor(url: string) {
    this.socket = io(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    this.socket.on(ServerEvents.STATE, (state: GameStateView) =>
      this.states.push(state),
    );
  }

  get state(): GameStateView | undefined {
    return this.states.at(-1);
  }

  async connected(): Promise<this> {
    if (!this.socket.connected) {
      await new Promise<void>((resolve, reject) => {
        this.socket.once('connect', () => resolve());
        this.socket.once('connect_error', reject);
      });
    }
    return this;
  }

  emit<T = undefined>(event: string, payload?: unknown): Promise<Ack<T>> {
    return payload === undefined
      ? (this.socket.timeout(5_000).emitWithAck(event) as Promise<Ack<T>>)
      : (this.socket.timeout(5_000).emitWithAck(event, payload) as Promise<Ack<T>>);
  }

  waitFor(
    predicate: (state: GameStateView) => boolean,
    timeoutMs = 15_000,
  ): Promise<GameStateView> {
    const existing = this.states.findLast(predicate);
    if (existing && existing === this.state) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.socket.off(ServerEvents.STATE, listener);
        reject(
          new Error(
            `Timed out waiting for state, last: ${JSON.stringify(this.state)}`,
          ),
        );
      }, timeoutMs);
      const listener = (state: GameStateView) => {
        if (predicate(state)) {
          clearTimeout(timer);
          this.socket.off(ServerEvents.STATE, listener);
          resolve(state);
        }
      };
      this.socket.on(ServerEvents.STATE, listener);
    });
  }

  close(): void {
    this.socket.disconnect();
  }
}
