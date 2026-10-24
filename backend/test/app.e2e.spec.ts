import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ClientEvents, type PublicInfo } from '../src/contracts/game.contract.js';
import { DatabaseService } from '../src/database/database.service.js';
import { playedGames, questions } from '../src/database/schema.js';
import type { GameSettings } from '../src/settings/game-settings.js';
import { startTestApp, type TestApp, TestPlayer } from './helpers.js';

describe('playduelio backend (e2e)', () => {
  let testApp: TestApp;
  let http: App;
  const players: TestPlayer[] = [];

  const player = async () => {
    const created = await new TestPlayer(testApp.url).connected();
    players.push(created);
    return created;
  };

  beforeAll(async () => {
    testApp = await startTestApp();
    http = testApp.app.getHttpServer() as App;
  });

  afterEach(() => {
    players.splice(0).forEach((p) => p.close());
  });

  afterAll(async () => {
    await testApp.close();
  });

  describe('public endpoints', () => {
    it('reports health', async () => {
      await request(http).get('/health').expect(200, { status: 'ok' });
    });

    it('serves public info and is not playable without questions', async () => {
      const response = await request(http).get('/api/info').expect(200);
      expect(response.body).toEqual<PublicInfo>({
        questionsPerGame: 7,
        questionDurationSec: 20,
        idleResetSec: 120,
        playable: false,
        paused: false,
      });
    });

    it('sets security headers', async () => {
      const response = await request(http).get('/api/info');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('games without questions', () => {
    it('refuses to start a game', async () => {
      const anna = await player();
      const ack = await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Anna' });
      expect(ack).toEqual({ ok: false, error: 'NOT_ENOUGH_QUESTIONS' });
    });
  });

  describe('test control', () => {
    it('imports the sample questions', async () => {
      const response = await request(http)
        .post('/api/test/questions/samples')
        .expect(201);
      expect(
        (response.body as { imported: number }).imported,
      ).toBeGreaterThanOrEqual(30);

      const info = await request(http).get('/api/info').expect(200);
      expect((info.body as PublicInfo).playable).toBe(true);
    });

    it('validates and stores settings', async () => {
      const settings: GameSettings = {
        questionsPerGame: 3,
        questionDurationSec: 5,
        revealDurationSec: 2,
        speedBonusEnabled: true,
        rematchTimeoutSec: 15,
        idleResetSec: 120,
      };
      await request(http)
        .put('/api/test/settings')
        .send({ ...settings, questionsPerGame: 99 })
        .expect(400);
      await request(http).put('/api/test/settings').send(settings).expect(200);

      const info = await request(http).get('/api/info').expect(200);
      expect((info.body as PublicInfo).questionDurationSec).toBe(5);
    });
  });

  describe('playing', () => {
    it('plays a complete friend game with a rematch', async () => {
      const anna = await player();
      const ben = await player();

      expect(
        await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Anna' }),
      ).toEqual({
        ok: true,
      });
      const waiting = await anna.waitFor((s) => s.phase === 'waiting');

      expect(
        await ben.emit(ClientEvents.JOIN_GAME, {
          gameCode: waiting.gameCode.toLowerCase(),
          playerName: 'Ben',
        }),
      ).toEqual({ ok: true });
      await ben.waitFor((s) => s.phase === 'countdown');

      let expectedScore = 0;
      for (let index = 0; index < 3; index++) {
        const question = await anna.waitFor(
          (s) => s.phase === 'question' && s.question?.index === index,
        );
        expect(question.question?.options).toHaveLength(4);
        expect(
          await anna.emit(ClientEvents.SUBMIT_ANSWER, {
            questionIndex: index,
            answerIndex: 0,
          }),
        ).toEqual({ ok: true });
        await ben.emit(ClientEvents.SUBMIT_ANSWER, {
          questionIndex: index,
          answerIndex: 1,
        });
        const reveal = await anna.waitFor(
          (s) => s.phase === 'reveal' && s.question?.index === index,
        );
        expect(reveal.reveal?.yourAnswerIndex).toBe(0);
        expect(reveal.reveal?.opponentAnswerIndex).toBe(1);
        expectedScore += reveal.reveal?.yourPoints ?? 0;
      }

      const finished = await anna.waitFor((s) => s.phase === 'finished');
      expect(finished.rematch).toBe('open');
      expect(finished.you.score).toBe(expectedScore);

      await anna.emit(ClientEvents.REQUEST_REMATCH);
      await ben.waitFor((s) => s.rematch === 'offered');
      await ben.emit(ClientEvents.REQUEST_REMATCH);
      const restarted = await anna.waitFor((s) => s.phase === 'countdown');
      expect(restarted.you.score).toBe(0);

      const { db } = testApp.app.get(DatabaseService);
      expect(await db.select().from(playedGames)).toHaveLength(1);
      const asked = (await db.select().from(questions)).filter(
        (q) => q.timesAsked > 0,
      );
      expect(asked).toHaveLength(3);
      expect(asked.every((q) => q.timesAsked === 2)).toBe(true);
    });

    it('matches two players in a quick game and aborts when one leaves', async () => {
      const anna = await player();
      const ben = await player();

      expect(
        await anna.emit(ClientEvents.START_MATCHMAKING, { playerName: 'Anna' }),
      ).toEqual({
        ok: true,
        data: 'queued',
      });
      expect(
        await ben.emit(ClientEvents.START_MATCHMAKING, { playerName: 'Ben' }),
      ).toEqual({
        ok: true,
        data: 'matched',
      });
      await anna.waitFor(
        (s) => s.phase === 'countdown' && s.opponent?.name === 'Ben',
      );

      await ben.emit(ClientEvents.LEAVE_GAME);
      const aborted = await anna.waitFor((s) => s.phase === 'aborted');
      expect(aborted.endReason).toBe('opponent-left');
    });

    it('lets a player resume after reconnecting', async () => {
      const anna = await player();
      const ben = await player();
      await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Anna' });
      const { gameCode } = await anna.waitFor((s) => s.phase === 'waiting');
      await ben.emit(ClientEvents.JOIN_GAME, { gameCode, playerName: 'Ben' });
      const { sessionToken } = await ben.waitFor((s) => s.phase === 'countdown');

      ben.close();
      await anna.waitFor((s) => s.opponent?.connected === false);

      const benAgain = await player();
      expect(await benAgain.emit(ClientEvents.RESUME, { sessionToken })).toEqual({
        ok: true,
      });
      const resumed = await benAgain.waitFor(() => true);
      expect(resumed.you.name).toBe('Ben');
      await anna.waitFor((s) => s.opponent?.connected === true);
    });

    it('validates socket input', async () => {
      const anna = await player();
      expect(
        await anna.emit(ClientEvents.CREATE_GAME, { playerName: '   ' }),
      ).toEqual({
        ok: false,
        error: 'INVALID_INPUT',
      });
      expect(
        await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Arschloch' }),
      ).toEqual({
        ok: false,
        error: 'NAME_REJECTED',
      });
      expect(await anna.emit(ClientEvents.CREATE_GAME, 'garbage')).toEqual({
        ok: false,
        error: 'INVALID_INPUT',
      });
      expect(
        await anna.emit(ClientEvents.JOIN_GAME, {
          gameCode: 'ZZZZ',
          playerName: 'Anna',
        }),
      ).toEqual({ ok: false, error: 'GAME_NOT_FOUND' });
      expect(
        await anna.emit(ClientEvents.SUBMIT_ANSWER, {
          questionIndex: 0,
          answerIndex: 0,
        }),
      ).toEqual({ ok: false, error: 'NOT_IN_GAME' });
      expect(await anna.emit(ClientEvents.RESUME, { sessionToken: 'nope' })).toEqual(
        {
          ok: false,
          error: 'SESSION_NOT_FOUND',
        },
      );
    });

    it('rate limits event floods', async () => {
      const anna = await player();
      const acks = await Promise.all(
        Array.from({ length: 40 }, () => anna.emit(ClientEvents.CANCEL_MATCHMAKING)),
      );
      expect(acks.some((ack) => !ack.ok && ack.error === 'RATE_LIMITED')).toBe(true);
    });
  });
});

describe('test control (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await startTestApp({ testControl: false, seedSampleQuestions: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('is hidden unless enabled', async () => {
    const http = testApp.app.getHttpServer() as App;
    await request(http).delete('/api/test/questions').expect(404);
  });

  it('seeds the sample questions into an empty in-memory database', async () => {
    const http = testApp.app.getHttpServer() as App;
    const info = await request(http).get('/api/info').expect(200);
    expect((info.body as PublicInfo).playable).toBe(true);
  });
});
