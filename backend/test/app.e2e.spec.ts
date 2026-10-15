import request from 'supertest';
import type { App } from 'supertest/types.js';
import type {
  AdminQuestion,
  AdminSettingsResponse,
  DashboardStats,
  LoginResponse,
} from '../src/contracts/admin.contract.js';
import { ClientEvents, type PublicInfo } from '../src/contracts/game.contract.js';
import {
  ADMIN_PASSWORD,
  startTestApp,
  type TestApp,
  TestPlayer,
} from './helpers.js';

const validQuestion = {
  text: 'Wie viele Beine hat eine Spinne?',
  options: ['6', '8', '10', '12'],
  correctIndex: 1,
  category: 'Natur',
  active: true,
};

describe('playduelio backend (e2e)', () => {
  let testApp: TestApp;
  let http: App;
  let token: string;
  const players: TestPlayer[] = [];

  const auth = () => ({ Authorization: `Bearer ${token}` });
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
        speedBonusEnabled: true,
        idleResetSec: 120,
        playable: false,
        playersOnline: 0,
      });
    });

    it('sets security headers', async () => {
      const response = await request(http).get('/api/info');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('admin authentication', () => {
    it('rejects a wrong password', async () => {
      await request(http)
        .post('/api/admin/auth/login')
        .send({ password: 'wrong' })
        .expect(401);
    });

    it('issues a token for the right password', async () => {
      const response = await request(http)
        .post('/api/admin/auth/login')
        .send({ password: ADMIN_PASSWORD })
        .expect(200);
      const body = response.body as LoginResponse;
      expect(body.token).toBeTruthy();
      expect(body.expiresAt).toBeGreaterThan(Date.now());
      token = body.token;

      await request(http).get('/api/admin/auth/session').set(auth()).expect(200);
    });

    it('ends a session immediately on logout', async () => {
      const response = await request(http)
        .post('/api/admin/auth/login')
        .send({ password: ADMIN_PASSWORD })
        .expect(200);
      const shortLived = (response.body as LoginResponse).token;
      const headers = { Authorization: `Bearer ${shortLived}` };

      await request(http).get('/api/admin/auth/session').set(headers).expect(200);
      await request(http).post('/api/admin/auth/logout').set(headers).expect(204);
      await request(http).get('/api/admin/auth/session').set(headers).expect(401);
      await request(http).get('/api/admin/auth/session').set(auth()).expect(200);
    });

    it('rejects tokens signed with a different secret', async () => {
      const forged =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiJ9.' +
        'c2lnbmF0dXJlLXdpdGgtd3Jvbmctc2VjcmV0';
      await request(http)
        .get('/api/admin/questions')
        .set({ Authorization: `Bearer ${forged}` })
        .expect(401);
    });

    it('protects admin routes', async () => {
      await request(http).get('/api/admin/questions').expect(401);
      await request(http)
        .get('/api/admin/questions')
        .set({ Authorization: 'Bearer not-a-token' })
        .expect(401);
    });
  });

  describe('games without questions', () => {
    it('refuses to start a game', async () => {
      const anna = await player();
      const ack = await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Anna' });
      expect(ack).toEqual({ ok: false, error: 'NOT_ENOUGH_QUESTIONS' });
    });
  });

  describe('question management', () => {
    let created: AdminQuestion;

    it.each([
      ['too few options', { ...validQuestion, options: ['a', 'b', 'c'] }],
      ['duplicate options', { ...validQuestion, options: ['a', 'A ', 'b', 'c'] }],
      ['empty option', { ...validQuestion, options: ['a', ' ', 'b', 'c'] }],
      ['correct index out of range', { ...validQuestion, correctIndex: 4 }],
      ['too short text', { ...validQuestion, text: 'Hm?' }],
      ['unknown fields', { ...validQuestion, hack: true }],
    ])('rejects %s', async (_, body) => {
      await request(http)
        .post('/api/admin/questions')
        .set(auth())
        .send(body)
        .expect(400);
    });

    it('creates, updates, toggles and deletes a question', async () => {
      const createResponse = await request(http)
        .post('/api/admin/questions')
        .set(auth())
        .send({
          ...validQuestion,
          text: '  Wie viele Beine hat eine Spinne?  ',
          category: '',
        })
        .expect(201);
      created = createResponse.body as AdminQuestion;
      expect(created).toMatchObject({
        text: 'Wie viele Beine hat eine Spinne?',
        category: null,
        active: true,
        timesAsked: 0,
      });

      const updated = await request(http)
        .put(`/api/admin/questions/${created.id}`)
        .set(auth())
        .send({ ...validQuestion, correctIndex: 2 })
        .expect(200);
      expect((updated.body as AdminQuestion).correctIndex).toBe(2);

      const toggled = await request(http)
        .patch(`/api/admin/questions/${created.id}/active`)
        .set(auth())
        .send({ active: false })
        .expect(200);
      expect((toggled.body as AdminQuestion).active).toBe(false);

      await request(http)
        .delete(`/api/admin/questions/${created.id}`)
        .set(auth())
        .expect(204);
      await request(http)
        .delete(`/api/admin/questions/${created.id}`)
        .set(auth())
        .expect(404);
    });

    it('imports the sample questions and lists them', async () => {
      const response = await request(http)
        .post('/api/admin/questions/import-samples')
        .set(auth())
        .expect(201);
      expect(
        (response.body as { imported: number }).imported,
      ).toBeGreaterThanOrEqual(30);

      const list = await request(http)
        .get('/api/admin/questions')
        .set(auth())
        .expect(200);
      expect((list.body as AdminQuestion[]).length).toBe(
        (response.body as { imported: number }).imported,
      );

      const info = await request(http).get('/api/info').expect(200);
      expect((info.body as PublicInfo).playable).toBe(true);
    });
  });

  describe('settings', () => {
    it('validates and stores settings', async () => {
      const current = await request(http)
        .get('/api/admin/settings')
        .set(auth())
        .expect(200);
      const body = current.body as AdminSettingsResponse;
      expect(body.limits.questionsPerGame).toEqual({ min: 3, max: 20 });
      expect(body.defaults).toMatchObject({
        questionsPerGame: 7,
        questionDurationSec: 20,
      });

      await request(http)
        .put('/api/admin/settings')
        .set(auth())
        .send({ ...body.settings, questionsPerGame: 99 })
        .expect(400);

      const saved = await request(http)
        .put('/api/admin/settings')
        .set(auth())
        .send({
          ...body.settings,
          questionsPerGame: 3,
          questionDurationSec: 5,
          revealDurationSec: 2,
          rematchTimeoutSec: 15,
        })
        .expect(200);
      expect((saved.body as AdminSettingsResponse).settings.questionsPerGame).toBe(
        3,
      );

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
      expect(finished.rematchAvailable).toBe(true);
      expect(finished.you.score).toBe(expectedScore);

      await anna.emit(ClientEvents.REQUEST_REMATCH);
      await ben.waitFor((s) => s.opponent?.rematchRequested === true);
      await ben.emit(ClientEvents.REQUEST_REMATCH);
      const restarted = await anna.waitFor((s) => s.phase === 'countdown');
      expect(restarted.you.score).toBe(0);

      const dashboard = await request(http)
        .get('/api/admin/dashboard')
        .set(auth())
        .expect(200);
      expect(
        (dashboard.body as DashboardStats).playersOnline,
      ).toBeGreaterThanOrEqual(2);
      expect(dashboard.body as DashboardStats).toMatchObject({
        gamesToday: 1,
        gamesTotal: 1,
        activeGames: 1,
        requiredQuestions: 3,
      });

      const questions = await request(http).get('/api/admin/questions').set(auth());
      const asked = (questions.body as AdminQuestion[]).filter(
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

describe('admin login throttling (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await startTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('blocks brute force attempts', async () => {
    const http = testApp.app.getHttpServer() as App;
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const response = await request(http)
        .post('/api/admin/auth/login')
        .send({ password: 'x' });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
