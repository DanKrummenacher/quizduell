import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  private clientToGameMap = new Map<string, string>();

  constructor(private readonly gameService: GameService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const gameCode = this.clientToGameMap.get(client.id);
    if (gameCode) {
      this.server.to(gameCode).emit('opponentLeft');
      this.clientToGameMap.delete(client.id);
    }
  }

  @SubscribeMessage('createGame')
  handleCreateGame(
    @MessageBody() data: { playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.gameService.createGame(client.id, data.playerName);
    client.join(session.gameCode);
    this.clientToGameMap.set(client.id, session.gameCode);

    return { event: 'gameCreated', data: session };
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @MessageBody() data: { gameCode: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.gameService.joinGame(
      data.gameCode.toUpperCase(),
      client.id,
      data.playerName,
    );

    if (!session) {
      return { event: 'error', data: 'Game not found or full' };
    }

    client.join(session.gameCode);
    this.clientToGameMap.set(client.id, session.gameCode);


    this.server.to(session.gameCode).emit('gameStart', session);
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: { gameCode: string; answerIndex: number; timeTakenMs: number },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.gameService.submitAnswer(
      data.gameCode,
      client.id,
      data.answerIndex,
      data.timeTakenMs,
    );

    if (!session) return;

    if (this.gameService.bothPlayersAnswered(session)) {
      const correctAnswerIndex = 0;

      this.gameService.evaluateRound(session, correctAnswerIndex);

      this.server.to(session.gameCode).emit('roundResult', session);
    } else {
      client.broadcast.to(session.gameCode).emit('opponentAnswered');
    }
  }
}
