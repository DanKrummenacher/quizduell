import type { GameStateView } from '../contracts/game.contract.js';
import type {
  GameQuestion,
  QuestionsService,
} from '../questions/questions.service.js';
import { DEFAULT_SETTINGS, type GameSettings } from '../settings/game-settings.js';
import type { SettingsService } from '../settings/settings.service.js';
import type { StatsService } from '../stats/stats.service.js';
import { GameService } from './game.service.js';
import {
  COUNTDOWN_MS,
  DISCONNECT_GRACE_MS,
  GameError,
  LEAVE_GRACE_MS,
} from './game.types.js';

const QUESTIONS: GameQuestion[] = [
  {
    id: 1,
    text: 'Q1',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    order: [0, 1, 2, 3],
  },
  {
    id: 2,
    text: 'Q2',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 1,
    order: [0, 1, 2, 3],
  },
  {
    id: 3,
    text: 'Q3',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 2,
    order: [0, 1, 2, 3],
  },
];

const SETTINGS: GameSettings = {
  ...DEFAULT_SETTINGS,
  questionsPerGame: 3,
  questionDurationSec: 10,
  revealDurationSec: 2,
  rematchTimeoutSec: 30,
};

function setup(
  overrides: {
    activeQuestions?: number;
    settings?: Partial<GameSettings>;
    paused?: boolean;
  } = {},
) {
  const settings = { ...SETTINGS, ...overrides.settings };
  const questionsService = {
    countActive: vi
      .fn()
      .mockResolvedValue(overrides.activeQuestions ?? QUESTIONS.length),
    pickRandom: vi.fn().mockResolvedValue(QUESTIONS.map((q) => ({ ...q }))),
    recordResults: vi.fn().mockResolvedValue(undefined),
  };
  const settingsService = {
    get: () => ({ ...settings }),
    isPaused: () => overrides.paused ?? false,
  };
  const statsService = { recordGame: vi.fn().mockResolvedValue(undefined) };
  const service = new GameService(
    questionsService as unknown as QuestionsService,
    settingsService as unknown as SettingsService,
    statsService as unknown as StatsService,
  );

  const states = new Map<string, GameStateView>();
  service.attachNotifier({
    sendState: (socketId, state) => states.set(socketId, state),
  });
  const state = (socketId: string) => states.get(socketId)!;

  return { service, state, questionsService, statsService };
}

/** Lets pending promises (question loading) settle while fake timers are active. */
async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}

async function startFriendGame(ctx: ReturnType<typeof setup>) {
  await ctx.service.createFriendGame('host', 'Anna');
  const code = ctx.state('host').gameCode;
  ctx.service.joinFriendGame('guest', code, 'Ben');
  await flush();
  return code;
}

async function toFirstQuestion(ctx: ReturnType<typeof setup>) {
  await startFriendGame(ctx);
  await vi.advanceTimersByTimeAsync(COUNTDOWN_MS);
}

describe('GameService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('friend games', () => {
    it('creates a waiting game with a code', async () => {
      const ctx = setup();
      await ctx.service.createFriendGame('host', 'Anna');

      const state = ctx.state('host');
      expect(state.phase).toBe('waiting');
      expect(state.mode).toBe('friend');
      expect(state.gameCode).toMatch(/^[A-Z2-9]{4}$/);
      expect(state.you.name).toBe('Anna');
      expect(state.opponent).toBeNull();
      expect(state.sessionToken.length).toBeGreaterThan(20);
    });

    it('refuses to create a game without enough active questions', async () => {
      const ctx = setup({ activeQuestions: 2 });
      await expect(ctx.service.createFriendGame('host', 'Anna')).rejects.toEqual(
        new GameError('NOT_ENOUGH_QUESTIONS'),
      );
    });

    it('refuses new duels while the game is paused', async () => {
      const ctx = setup({ paused: true });
      await expect(ctx.service.createFriendGame('host', 'Anna')).rejects.toEqual(
        new GameError('PAUSED'),
      );
      await expect(ctx.service.startMatchmaking('solo', 'Ben')).rejects.toEqual(
        new GameError('PAUSED'),
      );
    });

    it('starts a countdown once the second player joins', async () => {
      const ctx = setup();
      await startFriendGame(ctx);

      expect(ctx.state('host').phase).toBe('countdown');
      expect(ctx.state('guest').opponent?.name).toBe('Anna');
      expect(ctx.state('host').opponent?.name).toBe('Ben');
      expect(ctx.state('host').totalQuestions).toBe(3);
    });

    it('rejects unknown codes, full games and joining the own game', async () => {
      const ctx = setup();
      await ctx.service.createFriendGame('host', 'Anna');
      const code = ctx.state('host').gameCode;

      expect(() => ctx.service.joinFriendGame('x', 'ZZZZ', 'X')).toThrow(
        new GameError('GAME_NOT_FOUND'),
      );
      expect(() => ctx.service.joinFriendGame('host', code, 'Anna')).toThrow(
        new GameError('OWN_GAME'),
      );
      ctx.service.joinFriendGame('guest', code, 'Ben');
      expect(() => ctx.service.joinFriendGame('third', code, 'Cleo')).toThrow(
        new GameError('GAME_FULL'),
      );
    });

    it('removes a waiting game when the host leaves', async () => {
      const ctx = setup();
      await ctx.service.createFriendGame('host', 'Anna');
      const code = ctx.state('host').gameCode;
      ctx.service.leave('host');

      expect(() => ctx.service.joinFriendGame('guest', code, 'Ben')).toThrow(
        new GameError('GAME_NOT_FOUND'),
      );
    });
  });

  describe('quick games', () => {
    it('queues the first player and matches the second', async () => {
      const ctx = setup();
      await expect(ctx.service.startMatchmaking('a', 'Anna')).resolves.toBe(
        'queued',
      );
      expect(ctx.service.getLiveStats().playersSearching).toBe(1);

      await expect(ctx.service.startMatchmaking('b', 'Ben')).resolves.toBe(
        'matched',
      );
      expect(ctx.state('a').phase).toBe('countdown');
      expect(ctx.state('a').mode).toBe('quick');
      expect(ctx.state('b').opponent?.name).toBe('Anna');
      expect(ctx.service.getLiveStats().playersSearching).toBe(0);
    });

    it('does not match a player who cancelled or disconnected', async () => {
      const ctx = setup();
      await ctx.service.startMatchmaking('a', 'Anna');
      ctx.service.cancelMatchmaking('a');
      await expect(ctx.service.startMatchmaking('b', 'Ben')).resolves.toBe('queued');

      ctx.service.handleDisconnect('b');
      await expect(ctx.service.startMatchmaking('c', 'Cleo')).resolves.toBe(
        'queued',
      );
    });
  });

  describe('questions and scoring', () => {
    it('shows the question without the correct answer', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      const state = ctx.state('host');
      expect(state.phase).toBe('question');
      expect(state.question).toEqual({
        index: 0,
        text: 'Q1',
        options: ['a', 'b', 'c', 'd'],
      });
      expect(state.reveal).toBeNull();
      expect(JSON.stringify(state)).not.toContain('correctIndex');
      expect(state.phaseDurationMs).toBe(10_000);
    });

    it('awards base points plus a speed bonus measured on the server', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      await vi.advanceTimersByTimeAsync(2_000);
      ctx.service.submitAnswer('host', 0, 0);
      await vi.advanceTimersByTimeAsync(3_000);
      ctx.service.submitAnswer('guest', 0, 3);

      const state = ctx.state('host');
      expect(state.phase).toBe('reveal');
      expect(state.reveal).toEqual({
        correctIndex: 0,
        yourAnswerIndex: 0,
        opponentAnswerIndex: 3,
        yourPoints: 180,
        opponentPoints: 0,
      });
      expect(state.you.score).toBe(180);
      expect(ctx.state('guest').you.score).toBe(0);
    });

    it('gives only base points when the speed bonus is disabled', async () => {
      const ctx = setup({ settings: { speedBonusEnabled: false } });
      await toFirstQuestion(ctx);
      ctx.service.submitAnswer('host', 0, 0);
      ctx.service.submitAnswer('guest', 0, 0);

      expect(ctx.state('host').reveal?.yourPoints).toBe(100);
      expect(ctx.state('guest').reveal?.yourPoints).toBe(100);
    });

    it('tells the opponent that an answer was given, without revealing it', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      ctx.service.submitAnswer('host', 0, 2);

      expect(ctx.state('guest').opponent?.hasAnswered).toBe(true);
      expect(ctx.state('guest').phase).toBe('question');
      expect(ctx.state('guest').reveal).toBeNull();
    });

    it('rejects double answers, wrong question indexes and invalid options', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      expect(() => ctx.service.submitAnswer('host', 1, 0)).toThrow(
        new GameError('ANSWER_REJECTED'),
      );
      expect(() => ctx.service.submitAnswer('host', 0, 4)).toThrow(
        new GameError('ANSWER_REJECTED'),
      );
      ctx.service.submitAnswer('host', 0, 0);
      expect(() => ctx.service.submitAnswer('host', 0, 1)).toThrow(
        new GameError('ANSWER_REJECTED'),
      );
      expect(() => ctx.service.submitAnswer('nobody', 0, 1)).toThrow(
        new GameError('NOT_IN_GAME'),
      );
    });

    it('rejects late answers that arrive during the reveal', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(ctx.state('host').phase).toBe('reveal');
      expect(() => ctx.service.submitAnswer('host', 0, 0)).toThrow(
        new GameError('ANSWER_REJECTED'),
      );

      await vi.advanceTimersByTimeAsync(2_000);
      expect(ctx.state('host').phase).toBe('question');
      expect(ctx.state('host').you.hasAnswered).toBe(false);
    });

    it('reveals after the time is up when nobody answers', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(ctx.state('host').reveal).toMatchObject({
        yourAnswerIndex: null,
        yourPoints: 0,
      });
    });

    it('plays all questions, finishes and records the game', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      for (let index = 0; index < 3; index++) {
        expect(ctx.state('host').question?.index).toBe(index);
        ctx.service.submitAnswer('host', index, QUESTIONS[index]!.correctIndex);
        ctx.service.submitAnswer(
          'guest',
          index,
          (QUESTIONS[index]!.correctIndex + 1) % 4,
        );
        await vi.advanceTimersByTimeAsync(2_000);
      }

      const state = ctx.state('host');
      expect(state.phase).toBe('finished');
      expect(state.you.score).toBe(600);
      expect(state.opponent?.score).toBe(0);
      expect(state.rematch).toBe('open');
      expect(ctx.statsService.recordGame).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'friend',
          status: 'finished',
          questionsPlayed: 3,
        }),
      );
      expect(ctx.questionsService.recordResults).toHaveBeenCalledTimes(3);
    });
  });

  describe('end of game', () => {
    async function finishGame(ctx: ReturnType<typeof setup>) {
      await toFirstQuestion(ctx);
      for (let index = 0; index < 3; index++) {
        ctx.service.submitAnswer('host', index, 0);
        ctx.service.submitAnswer('guest', index, 0);
        await vi.advanceTimersByTimeAsync(2_000);
      }
    }

    it('starts a rematch when both players request it', async () => {
      const ctx = setup();
      await finishGame(ctx);

      ctx.service.requestRematch('host');
      expect(ctx.state('host').rematch).toBe('requested');
      expect(ctx.state('guest').rematch).toBe('offered');
      expect(ctx.state('guest').phase).toBe('finished');

      ctx.service.requestRematch('guest');
      await flush();
      expect(ctx.state('host').phase).toBe('countdown');
      expect(ctx.state('host').you.score).toBe(0);
      expect(ctx.questionsService.pickRandom).toHaveBeenCalledTimes(2);
    });

    it('gives the opponent the full time from the rematch request on', async () => {
      const ctx = setup();
      await finishGame(ctx);
      await vi.advanceTimersByTimeAsync(20_000);

      ctx.service.requestRematch('host');
      const offered = ctx.state('guest');
      expect(offered.rematch).toBe('offered');
      expect(offered.phaseDurationMs).toBe(30_000);
      expect(offered.phaseEndsAt! - Date.now()).toBe(30_000);

      await vi.advanceTimersByTimeAsync(20_000);
      expect(ctx.state('guest').rematch).toBe('offered');
    });

    it('closes the rematch window after the timeout', async () => {
      const ctx = setup();
      await finishGame(ctx);
      ctx.service.requestRematch('host');
      await vi.advanceTimersByTimeAsync(30_000);

      expect(ctx.state('host').rematch).toBe('unanswered');
      expect(ctx.state('guest').rematch).toBe('expired');
      expect(() => ctx.service.requestRematch('guest')).toThrow(
        new GameError('REMATCH_UNAVAILABLE'),
      );
    });

    it('informs the remaining player when the opponent leaves the result screen', async () => {
      const ctx = setup();
      await finishGame(ctx);
      ctx.service.leave('guest');

      expect(ctx.state('host').endReason).toBe('opponent-left');
      expect(ctx.state('host').rematch).toBe('opponent-left');
      expect(ctx.state('host').opponent).toMatchObject({ name: 'Ben', score: 200 });
    });

    it('offers a rematch in quick games too', async () => {
      const ctx = setup();
      await ctx.service.startMatchmaking('a', 'Anna');
      await ctx.service.startMatchmaking('b', 'Ben');
      await vi.advanceTimersByTimeAsync(COUNTDOWN_MS);
      for (let index = 0; index < 3; index++) {
        ctx.service.submitAnswer('a', index, 0);
        ctx.service.submitAnswer('b', index, 0);
        await vi.advanceTimersByTimeAsync(2_000);
      }

      expect(ctx.state('a').phase).toBe('finished');
      expect(ctx.state('a').rematch).toBe('open');
      ctx.service.requestRematch('a');
      ctx.service.requestRematch('b');
      expect(ctx.state('a').phase).toBe('countdown');
      expect(ctx.state('a').mode).toBe('quick');
    });

    it('pauses the rematch while the opponent reconnects', async () => {
      const ctx = setup();
      await finishGame(ctx);
      const token = ctx.state('guest').sessionToken;

      ctx.service.handleDisconnect('guest');
      expect(ctx.state('host').rematch).toBe('paused');
      expect(() => ctx.service.requestRematch('host')).toThrow(
        new GameError('REMATCH_UNAVAILABLE'),
      );

      ctx.service.resume('guest-new', token);
      expect(ctx.state('host').rematch).toBe('open');
    });
  });

  describe('leaving and reconnecting', () => {
    it('aborts a running game when a player leaves', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      ctx.service.leave('guest');

      expect(ctx.state('host').phase).toBe('aborted');
      expect(ctx.state('host').endReason).toBe('opponent-left');
      expect(ctx.state('host').opponent).toMatchObject({
        name: 'Ben',
        connected: false,
      });
    });

    it('keeps the game running during a short disconnect and resumes', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      const token = ctx.state('guest').sessionToken;

      ctx.service.handleDisconnect('guest');
      expect(ctx.state('host').opponent?.connected).toBe(false);
      expect(ctx.state('host').phase).toBe('question');

      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS - 1_000);
      ctx.service.resume('guest-new', token);

      expect(ctx.state('host').opponent?.connected).toBe(true);
      expect(ctx.state('guest-new').you.name).toBe('Ben');
      expect(ctx.state('guest-new').phase).toBe('question');
      expect(ctx.state('guest-new').question?.index).toBe(1);

      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS);
      expect(ctx.state('host').phase).not.toBe('aborted');
    });

    it('aborts the game when a disconnected player does not come back', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      const token = ctx.state('guest').sessionToken;

      ctx.service.handleDisconnect('guest');
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS);

      expect(ctx.state('host').phase).toBe('aborted');
      expect(ctx.state('host').endReason).toBe('opponent-disconnected');
      expect(() => ctx.service.resume('guest-new', token)).toThrow(
        new GameError('SESSION_NOT_FOUND'),
      );
    });

    it('ends the game quickly when the page closed the connection', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      ctx.service.handleDisconnect('guest', true);
      await vi.advanceTimersByTimeAsync(LEAVE_GRACE_MS - 1_000);
      expect(ctx.state('host').phase).toBe('question');

      await vi.advanceTimersByTimeAsync(1_000);
      expect(ctx.state('host').phase).toBe('aborted');
      expect(ctx.state('host').endReason).toBe('opponent-left');
    });

    it('still resumes after a reload that closed the connection', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      const token = ctx.state('guest').sessionToken;

      ctx.service.handleDisconnect('guest', true);
      await vi.advanceTimersByTimeAsync(2_000);
      ctx.service.resume('guest-new', token);
      await vi.advanceTimersByTimeAsync(LEAVE_GRACE_MS);

      expect(ctx.state('host').phase).toBe('question');
      expect(ctx.state('host').opponent?.connected).toBe(true);
    });

    it('leaves a game by its session token from a new connection', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      const token = ctx.state('guest').sessionToken;

      ctx.service.handleDisconnect('guest');
      ctx.service.leave('guest-new', token);

      expect(ctx.state('host').phase).toBe('aborted');
      expect(ctx.state('host').endReason).toBe('opponent-left');
      expect(() => ctx.service.resume('guest-new', token)).toThrow(
        new GameError('SESSION_NOT_FOUND'),
      );
    });

    it('ignores leaving with an unknown session token', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);

      ctx.service.leave('stranger', 'unknown');
      expect(ctx.state('host').phase).toBe('question');
    });

    it('leaves the previous game when starting a new one', async () => {
      const ctx = setup();
      await toFirstQuestion(ctx);
      await ctx.service.createFriendGame('guest', 'Ben');

      expect(ctx.state('host').phase).toBe('aborted');
      expect(ctx.state('guest').phase).toBe('waiting');
    });

    it('rejects unknown session tokens', () => {
      const ctx = setup();
      expect(() => ctx.service.resume('x', 'unknown')).toThrow(
        new GameError('SESSION_NOT_FOUND'),
      );
    });
  });

  it('aborts when no questions could be loaded', async () => {
    const ctx = setup();
    ctx.questionsService.pickRandom.mockResolvedValue([]);
    await startFriendGame(ctx);
    await vi.advanceTimersByTimeAsync(COUNTDOWN_MS);

    expect(ctx.state('host').phase).toBe('aborted');
    expect(ctx.state('host').endReason).toBe('expired');
  });

  it('reports live statistics', async () => {
    const ctx = setup();
    await toFirstQuestion(ctx);
    await ctx.service.startMatchmaking('solo', 'Cleo');

    expect(ctx.service.getLiveStats()).toEqual({
      activeGames: 1,
      playersInGames: 2,
      playersSearching: 1,
    });
  });
});
