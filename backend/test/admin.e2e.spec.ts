import { eq } from 'drizzle-orm';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type {
  AdminQuestion,
  AdminSession,
  AdminSettingsView,
  Analytics,
  AuditPage,
  Hint,
  LiveSnapshot,
  QuestionInput,
} from '../src/contracts/admin.contract.js';
import { ClientEvents } from '../src/contracts/game.contract.js';
import { DatabaseService } from '../src/database/database.service.js';
import { questions } from '../src/database/schema.js';
import { startTestApp, type TestApp, TestPlayer } from './helpers.js';

const PASSWORD = 'test-admin-password';

const QUESTION: QuestionInput = {
  text: '  Wie viele   Kantone hat die Schweiz? ',
  options: ['26', '23', '20', '24'],
  correctIndex: 0,
  category: 'Schweiz',
  active: true,
};

describe('admin API (e2e)', () => {
  let testApp: TestApp;
  let http: App;
  let token = '';
  const players: TestPlayer[] = [];

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const get = (path: string) => request(http).get(`/api/admin${path}`).set(auth());
  const post = (path: string, body?: object) =>
    request(http)
      .post(`/api/admin${path}`)
      .set(auth())
      .send(body ?? {});
  const put = (path: string, body: object) =>
    request(http).put(`/api/admin${path}`).set(auth()).send(body);
  const del = (path: string) =>
    request(http).delete(`/api/admin${path}`).set(auth());

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

  describe('sign-in', () => {
    it('refuses requests without a valid token', async () => {
      await request(http).get('/api/admin/questions').expect(401);
      await request(http)
        .get('/api/admin/questions')
        .set('Authorization', 'Bearer nonsense')
        .expect(401);
    });

    it('refuses a wrong password', async () => {
      await request(http)
        .post('/api/admin/login')
        .send({ password: 'wrong' })
        .expect(401);
      await request(http).post('/api/admin/login').send({}).expect(400);
    });

    it('signs in with the admin password', async () => {
      const response = await request(http)
        .post('/api/admin/login')
        .send({ password: PASSWORD })
        .expect(200);
      const session = response.body as AdminSession;
      expect(session.expiresAt).toBeGreaterThan(Date.now());
      token = session.token;
      await get('/session').expect(200, { ok: true });
    });

    it('refuses a tampered token', async () => {
      const [payload, signature] = token.split('.');
      const forged = Buffer.from(JSON.stringify({ exp: Date.now() * 2 })).toString(
        'base64url',
      );
      expect(payload).not.toBe(forged);
      await request(http)
        .get('/api/admin/session')
        .set('Authorization', `Bearer ${forged}.${signature}`)
        .expect(401);
    });
  });

  describe('questions', () => {
    let id = 0;

    it('creates a question and normalises its text', async () => {
      const response = await post('/questions', QUESTION).expect(201);
      const created = response.body as AdminQuestion;
      id = created.id;
      expect(created.text).toBe('Wie viele Kantone hat die Schweiz?');
      expect(created.stats).toMatchObject({ answers: 0, picks: [0, 0, 0, 0] });
    });

    it('rejects invalid questions with a readable message', async () => {
      const duplicate = await post('/questions', {
        ...QUESTION,
        options: ['26', '26', '20', '24'],
      }).expect(400);
      expect((duplicate.body as { message: string }).message).toBe(
        'Zwei Antworten sind gleich.',
      );
      await post('/questions', { ...QUESTION, options: ['1', '2', '3'] }).expect(
        400,
      );
      await post('/questions', { ...QUESTION, correctIndex: 4 }).expect(400);
      await post('/questions', { ...QUESTION, text: '   ' }).expect(400);
      await post('/questions', { ...QUESTION, extra: true }).expect(400);
    });

    it('updates a question', async () => {
      const response = await put(`/questions/${id}`, {
        ...QUESTION,
        category: '  ',
        active: false,
      }).expect(200);
      expect(response.body).toMatchObject({ category: null, active: false });
    });

    it('imports questions and skips duplicates', async () => {
      const response = await post('/questions/import', {
        skipDuplicates: true,
        questions: [
          { ...QUESTION, text: 'wie viele kantone hat die schweiz?' },
          { ...QUESTION, text: 'Frage A', options: ['a', 'b', 'c', 'd'] },
          { ...QUESTION, text: 'Frage B', options: ['a', 'b', 'c', 'd'] },
          { ...QUESTION, text: 'Frage C', options: ['a', 'b', 'c', 'd'] },
        ],
      }).expect(200);
      expect(response.body).toEqual({ imported: 3, skipped: 1 });

      const invalid = await post('/questions/import', {
        skipDuplicates: false,
        questions: [QUESTION, { ...QUESTION, options: ['a', 'a', 'b', 'c'] }],
      }).expect(400);
      expect((invalid.body as { message: string }).message).toMatch(/^Zeile 2:/);
    });

    it('changes many questions at once', async () => {
      const list = (await get('/questions').expect(200)).body as AdminQuestion[];
      expect(list).toHaveLength(4);
      const ids = list.map((q) => q.id);
      await post('/questions/bulk', { ids, action: 'activate' }).expect(200, {
        affected: 4,
      });
      await post('/questions/bulk', {
        ids,
        action: 'category',
        category: 'Allgemein',
      }).expect(200, { affected: 4 });
      await post('/questions/bulk', { ids, action: 'explode' }).expect(400);

      const after = (await get('/questions')).body as AdminQuestion[];
      expect(after.every((q) => q.active && q.category === 'Allgemein')).toBe(true);
    });

    it('deletes a question', async () => {
      await del(`/questions/${id}`).expect(204);
      await del(`/questions/${id}`).expect(404);
      await get(`/questions/${id}/history`).expect(404);
    });
  });

  describe('settings', () => {
    it('updates the rules, records and restores them', async () => {
      const view = (await get('/settings').expect(200)).body as AdminSettingsView;
      expect(view.limits.questionsPerGame).toEqual({ min: 3, max: 20 });

      await put('/settings', { ...view.settings, questionsPerGame: 99 }).expect(400);
      const updated = await put('/settings', {
        ...view.settings,
        questionsPerGame: 3,
        questionDurationSec: 5,
        revealDurationSec: 2,
      }).expect(200);
      expect((updated.body as AdminSettingsView).settings.questionsPerGame).toBe(3);

      const audit = (await get('/audit').expect(200)).body as AuditPage;
      const change = audit.entries.find((e) => e.action === 'settings.update')!;
      expect(change.summary).toContain('Fragen pro Duell 7 → 3');
      expect(change.before?.questionsPerGame).toBe(7);

      const restored = await post(`/audit/${change.id}/restore`).expect(200);
      expect((restored.body as AdminSettingsView).settings.questionsPerGame).toBe(7);

      // Short rules again for the duel below.
      await put('/settings', {
        ...view.settings,
        questionsPerGame: 3,
        questionDurationSec: 5,
        revealDurationSec: 2,
      }).expect(200);
    });

    it('pages through the audit log', async () => {
      const first = (await get('/audit?limit=2').expect(200)).body as AuditPage;
      expect(first.entries).toHaveLength(2);
      expect(first.nextCursor).not.toBeNull();
      const next = (await get(`/audit?limit=2&before=${first.nextCursor}`))
        .body as AuditPage;
      expect(next.entries[0]!.id).toBeLessThan(first.entries[1]!.id);
    });
  });

  describe('live and statistics', () => {
    it('shows a running duel and records it with picks in stored order', async () => {
      const anna = await player();
      const ben = await player();
      await anna.emit(ClientEvents.CREATE_GAME, { playerName: 'Anna' });
      const waiting = await anna.waitFor((s) => s.phase === 'waiting');

      let live = (await get('/live').expect(200)).body as LiveSnapshot;
      expect(live.waiting).toEqual([
        expect.objectContaining({ code: waiting.gameCode, name: 'Anna' }),
      ]);

      await ben.emit(ClientEvents.JOIN_GAME, {
        gameCode: waiting.gameCode,
        playerName: 'Ben',
      });
      const stored = (await get('/questions')).body as AdminQuestion[];

      for (let index = 0; index < 3; index++) {
        const state = await anna.waitFor(
          (s) => s.phase === 'question' && s.question?.index === index,
        );
        const shown = state.question!;
        const source = stored.find((q) => q.text === shown.text)!;
        const correctText = source.options[source.correctIndex]!;
        // Anna answers correctly; Ben lets the time run out once, then errs.
        await anna.emit(ClientEvents.SUBMIT_ANSWER, {
          questionIndex: index,
          answerIndex: shown.options.indexOf(correctText),
        });
        if (index === 0) {
          live = (await get('/live')).body as LiveSnapshot;
          expect(live.duels).toHaveLength(1);
          expect(live.duels[0]).toMatchObject({
            code: waiting.gameCode,
            phase: 'question',
            players: [
              expect.objectContaining({ name: 'Anna', answered: true }),
              expect.objectContaining({ name: 'Ben', answered: false }),
            ],
          });
        }
        if (index > 0) {
          await ben.emit(ClientEvents.SUBMIT_ANSWER, {
            questionIndex: index,
            answerIndex: shown.options.findIndex((option) => option !== correctText),
          });
        }
        await anna.waitFor(
          (s) => s.phase === 'reveal' && s.question?.index === index,
        );
      }
      await anna.waitFor((s) => s.phase === 'finished');

      live = (await get('/live')).body as LiveSnapshot;
      expect(live.duels[0]?.rounds).toHaveLength(3);
      expect(live.events.map((e) => e.kind)).toEqual([
        'finished',
        'joined',
        'created',
      ]);

      const asked = ((await get('/questions')).body as AdminQuestion[]).filter(
        (q) => q.stats.answers > 0,
      );
      expect(asked).toHaveLength(3);
      for (const question of asked) {
        const { stats } = question;
        expect(stats.correct).toBe(1);
        expect(stats.picks[question.correctIndex]).toBe(1);
        expect(stats.picks.reduce((a, b) => a + b, 0)).toBe(stats.answers);
        expect(stats.answers + stats.timeouts).toBe(2);
        expect(stats.recent).toEqual({ answers: stats.answers, correct: 1 });
        expect(stats.avgAnswerMs).not.toBeNull();
      }

      const analytics = (await get('/analytics?range=7').expect(200))
        .body as Analytics;
      expect(analytics.current).toMatchObject({
        games: 1,
        finished: 1,
        aborted: 0,
        answers: 5,
        correct: 3,
        timeouts: 1,
      });
      expect(analytics.days).toHaveLength(7);
      expect(analytics.previousDays).toHaveLength(7);
      expect(analytics.modes.friend).toBe(1);
      expect(analytics.heatmap.flat().reduce((a, b) => a + b, 0)).toBe(1);
      await get('/analytics?range=12').expect(400);
    });

    it('records an aborted duel with its reason', async () => {
      const anna = await player();
      const ben = await player();
      await anna.emit(ClientEvents.START_MATCHMAKING, { playerName: 'Anna' });
      await ben.emit(ClientEvents.START_MATCHMAKING, { playerName: 'Ben' });
      await anna.waitFor((s) => s.phase === 'countdown');
      await ben.emit(ClientEvents.LEAVE_GAME);
      await anna.waitFor((s) => s.phase === 'aborted');

      const analytics = (await get('/analytics?range=7')).body as Analytics;
      expect(analytics.current.aborted).toBe(1);
      expect(analytics.endReasons).toEqual([{ reason: 'opponent-left', count: 1 }]);
      expect(analytics.abortsByQuestion).toEqual([1]);
    });
  });

  describe('hints', () => {
    it('detects a luring answer and lets the admin ignore it', async () => {
      const [target] = (await get('/questions')).body as AdminQuestion[];
      const { db } = testApp.app.get(DatabaseService);
      const wrong = (target!.correctIndex + 1) % 4;
      const picks = [0, 0, 0, 0];
      picks[target!.correctIndex] = 8;
      picks[wrong] = 20;
      await db
        .update(questions)
        .set({ picks, timesAsked: 28, timesCorrect: 8 })
        .where(eq(questions.id, target!.id));

      let hints = (await get('/hints').expect(200)).body as Hint[];
      const lure = hints.find((h) => h.key === `lure:${target!.id}`)!;
      expect(lure).toMatchObject({
        type: 'lure',
        optionIndex: wrong,
        ignored: false,
      });
      // Only four questions for duels of three: players see repeats soon.
      expect(hints.some((h) => h.type === 'pool-small')).toBe(true);

      await post(`/hints/${lure.key}/ignore`).expect(204);
      hints = (await get('/hints')).body as Hint[];
      expect(hints.find((h) => h.key === lure.key)?.ignored).toBe(true);
      await del(`/hints/${lure.key}/ignore`).expect(204);
      await post('/hints/DROP TABLE/ignore').expect(400);
    });
  });

  it('throttles sign-in attempts', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(http).post('/api/admin/login').send({ password: 'guess' }),
      ),
    );
    expect(attempts.some((response) => response.status === 429)).toBe(true);
  });
});
