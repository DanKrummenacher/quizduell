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
  RoundResultData,
  QUESTION_DURATION_MS,
  ROUND_RESULT_DURATION_MS,
  REMATCH_TIMEOUT_MS,
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
  private matchmakingQueue: { socketId: string; playerName: string }[] = [];

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
      this.gameService.markSessionAborted(gameCode);
      this.gameService.scheduleGameCleanup(gameCode, () => {
        this.server.to(gameCode).emit(GameEvents.SESSION_EXPIRED);
      });
    }
    this.removeFromMatchmaking(client.id);
  }

  private removeFromMatchmaking(socketId: string) {
    this.matchmakingQueue = this.matchmakingQueue.filter(
      (p) => p.socketId !== socketId,
    );
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

    if (session === 'OWN_GAME') {
      return { event: GameEvents.ERROR, data: 'Cannot join own game' };
    }

    if (!session) {
      return { event: GameEvents.ERROR, data: 'Game not found or full' };
    }

    client.join(session.gameCode);
    this.clientToGameMap.set(client.id, session.gameCode);

    this.server
      .to(session.gameCode)
      .emit(GameEvents.GAME_START, this.gameService.toClientSession(session));

    session.roundTimer = setTimeout(() => this.sendQuestion(session), 3000);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(GameEvents.START_MATCHMAKING)
  handleStartMatchmaking(
    @MessageBody() data: { playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Player ${data.playerName} joined matchmaking`);

    this.removeFromMatchmaking(client.id);

    if (this.matchmakingQueue.length > 0) {
      const opponent = this.matchmakingQueue.shift();

      const session = this.gameService.createGame(
        opponent.socketId,
        opponent.playerName,
      );

      const startedSession = this.gameService.joinGame(
        session.gameCode,
        client.id,
        data.playerName,
      );

      if (!startedSession || startedSession === 'OWN_GAME') {
        return;
      }

      this.server.in(opponent.socketId).socketsJoin(startedSession.gameCode);
      this.server.in(client.id).socketsJoin(startedSession.gameCode);

      this.clientToGameMap.set(opponent.socketId, startedSession.gameCode);
      this.clientToGameMap.set(client.id, startedSession.gameCode);

      this.server
        .to(startedSession.gameCode)
        .emit(
          GameEvents.GAME_START,
          this.gameService.toClientSession(startedSession),
        );

      startedSession.roundTimer = setTimeout(
        () => this.sendQuestion(startedSession),
        3000,
      );
    } else {
      this.matchmakingQueue.push({
        socketId: client.id,
        playerName: data.playerName,
      });
    }
  }

  @SubscribeMessage(GameEvents.CANCEL_MATCHMAKING)
  handleCancelMatchmaking(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} cancelled matchmaking`);
    this.removeFromMatchmaking(client.id);
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
    if (session.status === ('aborted' as any)) return;
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
      questionIndex: session.currentQuestionIndex,
    };

    this.server
      .to(session.gameCode)
      .emit(GameEvents.NEW_QUESTION, safeQuestion);

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

    const question = session.questions[session.currentQuestionIndex];
    const nextRoundStartTimeMs = Date.now() + ROUND_RESULT_DURATION_MS;
    const payload: RoundResultData = {
      session: this.gameService.toClientSession(session),
      correctAnswer: question.correctAnswerIndex,
      playerAnswers,
      nextRoundStartTimeMs,
      totalDurationMs: ROUND_RESULT_DURATION_MS,
    };

    this.server.to(session.gameCode).emit(GameEvents.ROUND_RESULT, payload);

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
        this.gameService.scheduleGameCleanup(session.gameCode, () => {
          this.server.to(session.gameCode).emit(GameEvents.SESSION_EXPIRED);
        });
      }
    }, ROUND_RESULT_DURATION_MS);
  }

  @SubscribeMessage(GameEvents.REMATCH_REQUEST)
  handleRematchRequest(@ConnectedSocket() client: Socket) {
    const gameCode = this.clientToGameMap.get(client.id);
    if (!gameCode) return;

    const session = this.gameService.getSession(gameCode);
    if (!session) return;

    const bothReady = this.gameService.handleRematchRequest(
      gameCode,
      client.id,
    );
    if (bothReady) {
      if (session.rematchTimer) clearTimeout(session.rematchTimer);
      const newSession = this.gameService.restartGame(gameCode);
      if (newSession) {
        this.server
          .to(newSession.gameCode)
          .emit(
            GameEvents.GAME_START,
            this.gameService.toClientSession(newSession),
          );

        newSession.roundTimer = setTimeout(
          () => this.sendQuestion(newSession),
          3000,
        );
      }
    } else {
      if (!session.rematchTimer) {
        client.to(gameCode).emit(GameEvents.OPPONENT_REQUESTED_REMATCH);
        session.rematchTimer = setTimeout(() => {
          this.server.to(gameCode).emit(GameEvents.OPPONENT_LEFT);
          this.gameService.scheduleGameCleanup(gameCode, () => {
            this.server.to(gameCode).emit(GameEvents.SESSION_EXPIRED);
          });
        }, REMATCH_TIMEOUT_MS);
      }
    }
  }
}
