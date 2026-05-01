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
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateGameDto, JoinGameDto, SubmitAnswerDto } from './dto/game.dto';
import {
  GameSession,
  QUESTION_DURATION_MS,
  ROUND_RESULT_DURATION_MS,
} from './game.types';
import { GameEvents } from './game.events';
import { WsExceptionsFilter } from '../common/filters/ws-exceptions.filter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WsExceptionsFilter())
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private clientToGameMap = new Map<string, string>();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const gameCode = this.clientToGameMap.get(client.id);
    if (gameCode) {
      this.server.to(gameCode).emit(GameEvents.OPPONENT_LEFT);
      this.clientToGameMap.delete(client.id);
      this.gameService.scheduleGameCleanup(gameCode);
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(GameEvents.CREATE_GAME)
  handleCreateGame(
    @MessageBody() data: CreateGameDto,
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.gameService.createGame(client.id, data.playerName);
    client.join(session.gameCode);
    this.clientToGameMap.set(client.id, session.gameCode);

    return {
      event: GameEvents.GAME_CREATED,
      data: this.gameService.toClientSession(session),
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(GameEvents.JOIN_GAME)
  handleJoinGame(
    @MessageBody() data: JoinGameDto,
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.gameService.joinGame(
      data.gameCode.toUpperCase(),
      client.id,
      data.playerName,
    );

    if (!session) {
      return { event: GameEvents.ERROR, data: 'Game not found or full' };
    }

    client.join(session.gameCode);
    this.clientToGameMap.set(client.id, session.gameCode);

    this.server
      .to(session.gameCode)
      .emit(GameEvents.GAME_START, this.gameService.toClientSession(session));

    setTimeout(() => this.sendQuestion(session), 3000);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(GameEvents.SUBMIT_ANSWER)
  handleSubmitAnswer(
    @MessageBody() data: SubmitAnswerDto,
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
      this.endRound(session);
    } else {
      client.broadcast.to(session.gameCode).emit(GameEvents.OPPONENT_ANSWERED);
    }
  }

  private sendQuestion(session: GameSession) {
    if (session.roundTimer) clearTimeout(session.roundTimer);

    session.status = 'in-game';
    session.questionStartTimeMs = Date.now();

    const currentQ = session.questions[session.currentQuestionIndex];
    const endTimeMs = session.questionStartTimeMs + QUESTION_DURATION_MS;
    const safeQuestion = {
      text: currentQ.text,
      options: currentQ.options,
      endTimeMs,
      totalDurationMs: QUESTION_DURATION_MS,
    };

    this.server.to(session.gameCode).emit(GameEvents.NEW_QUESTION, safeQuestion);

    session.roundTimer = setTimeout(
      () => this.endRound(session),
      QUESTION_DURATION_MS,
    );
  }

  private endRound(session: GameSession) {
    if (session.status === 'result') return;
    session.status = 'result';

    if (session.roundTimer) clearTimeout(session.roundTimer);

    const playerAnswers: Record<string, number | null> = {};
    for (const [socketId, player] of Object.entries(session.players)) {
      playerAnswers[socketId] =
        player.currentAnswerIndex !== undefined
          ? player.currentAnswerIndex
          : null;
    }

    this.gameService.evaluateRound(session);

    const correctAnswer =
      session.questions[session.currentQuestionIndex].correctAnswerIndex;
    const nextRoundStartTimeMs = Date.now() + ROUND_RESULT_DURATION_MS;
    this.server.to(session.gameCode).emit(GameEvents.ROUND_RESULT, {
      session: this.gameService.toClientSession(session),
      correctAnswer,
      playerAnswers,
      nextRoundStartTimeMs,
      totalDurationMs: ROUND_RESULT_DURATION_MS,
    });

    setTimeout(() => {
      const hasNext = this.gameService.nextRound(session);
      if (hasNext) {
        this.sendQuestion(session);
      } else {
        this.server
          .to(session.gameCode)
          .emit(
            GameEvents.GAME_OVER,
            this.gameService.toClientSession(session),
          );
        this.gameService.scheduleGameCleanup(session.gameCode);
      }
    }, ROUND_RESULT_DURATION_MS);
  }
}
