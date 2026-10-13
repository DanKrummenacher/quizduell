import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Server, Socket } from 'socket.io';
import {
  type Ack,
  ClientEvents,
  type ErrorCode,
  type MatchmakingStatus,
  ServerEvents,
} from '../contracts/game.contract.js';
import { normalizeGameCode } from './game-code.js';
import { GameService } from './game.service.js';
import { GameError } from './game.types.js';
import { checkPlayerName } from './player-name.js';
import { RateLimiter } from './rate-limiter.js';

const ok = <T>(data: T): Ack<T> => ({ ok: true, data });
const fail = (error: ErrorCode): Ack<never> => ({ ok: false, error });

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private readonly limiter = new RateLimiter(30, 10_000);

  constructor(private readonly gameService: GameService) {}

  afterInit(): void {
    this.gameService.attachNotifier({
      sendState: (socketId, state) => {
        this.server.to(socketId).emit(ServerEvents.STATE, state);
      },
    });
  }

  handleConnection(): void {
    // Connections are tracked by socket.io itself (see `onlineCount`).
  }

  handleDisconnect(client: Socket): void {
    this.limiter.forget(client.id);
    this.gameService.handleDisconnect(client.id);
  }

  /** Number of connected sockets (devices with the app open). */
  get onlineCount(): number {
    // Depending on the setup Nest injects the server or its default namespace.
    const target = this.server as Server | Namespace | undefined;
    if (!target) {
      return 0;
    }
    return 'engine' in target ? target.engine.clientsCount : target.sockets.size;
  }

  @SubscribeMessage(ClientEvents.CREATE_GAME)
  createGame(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.run(client, async () => {
      const name = this.parseName(body);
      await this.gameService.createFriendGame(client.id, name);
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.JOIN_GAME)
  joinGame(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.run(client, () => {
      const name = this.parseName(body);
      const code = normalizeGameCode(field(body, 'gameCode'));
      if (!code) {
        throw new GameError('GAME_NOT_FOUND');
      }
      this.gameService.joinFriendGame(client.id, code, name);
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.START_MATCHMAKING)
  startMatchmaking(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.run(client, async (): Promise<MatchmakingStatus> => {
      const name = this.parseName(body);
      return this.gameService.startMatchmaking(client.id, name);
    });
  }

  @SubscribeMessage(ClientEvents.CANCEL_MATCHMAKING)
  cancelMatchmaking(@ConnectedSocket() client: Socket) {
    return this.run(client, () => {
      this.gameService.cancelMatchmaking(client.id);
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.SUBMIT_ANSWER)
  submitAnswer(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.run(client, () => {
      const questionIndex = field(body, 'questionIndex');
      const answerIndex = field(body, 'answerIndex');
      if (!Number.isInteger(questionIndex) || !Number.isInteger(answerIndex)) {
        throw new GameError('INVALID_INPUT');
      }
      this.gameService.submitAnswer(
        client.id,
        questionIndex as number,
        answerIndex as number,
      );
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.REQUEST_REMATCH)
  requestRematch(@ConnectedSocket() client: Socket) {
    return this.run(client, () => {
      this.gameService.requestRematch(client.id);
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.LEAVE_GAME)
  leaveGame(@ConnectedSocket() client: Socket) {
    return this.run(client, () => {
      this.gameService.leave(client.id);
      return undefined;
    });
  }

  @SubscribeMessage(ClientEvents.RESUME)
  resume(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.run(client, () => {
      const token = field(body, 'sessionToken');
      if (typeof token !== 'string' || token.length === 0 || token.length > 100) {
        throw new GameError('INVALID_INPUT');
      }
      this.gameService.resume(client.id, token);
      return undefined;
    });
  }

  private parseName(body: unknown): string {
    const result = checkPlayerName(field(body, 'playerName'));
    if (!result.ok) {
      throw new GameError(
        result.reason === 'blocked' ? 'NAME_REJECTED' : 'INVALID_INPUT',
      );
    }
    return result.name;
  }

  private async run<T>(
    client: Socket,
    action: () => T | Promise<T>,
  ): Promise<Ack<T>> {
    if (!this.limiter.allow(client.id)) {
      return fail('RATE_LIMITED');
    }
    try {
      return ok(await action());
    } catch (error) {
      if (error instanceof GameError) {
        return fail(error.code);
      }
      this.logger.error(`Unexpected socket error: ${String(error)}`);
      return fail('SERVER_ERROR');
    }
  }
}

function field(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)[key]
    : undefined;
}
