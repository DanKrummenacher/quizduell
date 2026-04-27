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

  // Simple mapping to keep track of which socket is in which game
  private clientToGameMap = new Map<string, string>();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const gameCode = this.clientToGameMap.get(client.id);
    if (gameCode) {
      // Handle player leaving... for now we just notify the other player
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

    // Notify both players that the pre-game countdown can start
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

    // Check if both players answered
    if (this.gameService.bothPlayersAnswered(session)) {
      // In a real app we fetch the correct answer from DB. 
      // For now we assume correctAnswerIndex is 0 for testing, this will be integrated later.
      const correctAnswerIndex = 0; 
      
      this.gameService.evaluateRound(session, correctAnswerIndex);
      
      // Emit the round result to both players
      this.server.to(session.gameCode).emit('roundResult', session);
    } else {
      // Tell the other player that opponent has answered
      client.broadcast.to(session.gameCode).emit('opponentAnswered');
    }
  }
}
