import type {
  LiveDuel,
  LiveEvent,
  LiveSample,
  LiveSnapshot,
} from '../contracts/admin.contract.js';
import { questionNumber, totalQuestions } from './game-view.js';
import {
  LIVE_EVENT_LIMIT,
  LIVE_HISTORY_MINUTES,
  LIVE_SAMPLE_MS,
  type LiveStats,
  type Session,
} from './game.types.js';

const RUNNING_PHASES = new Set(['countdown', 'question', 'reveal']);

export interface QueueEntry {
  socketId: string;
  name: string;
  since: number;
}

/** What the live page of the admin needs to know about the engine. */
export interface LiveSource {
  sessions(): Iterable<Session>;
  queue(): readonly QueueEntry[];
  paused(): boolean;
}

/**
 * Keeps what the admin shows on its live page: the event log, one load sample
 * per minute of the last hour and the peak since the start.
 */
export class LiveMonitor {
  private readonly startedAt = Date.now();
  private events: LiveEvent[] = [];
  private eventId = 0;
  private history: LiveSample[] = [];
  private peak: { games: number; at: number } | null = null;
  private sampler: NodeJS.Timeout | null = null;

  constructor(private readonly source: LiveSource) {}

  start(): void {
    this.sampler = setInterval(() => this.sample(), LIVE_SAMPLE_MS);
    this.sampler.unref();
  }

  stop(): void {
    if (this.sampler) {
      clearInterval(this.sampler);
      this.sampler = null;
    }
  }

  stats(): LiveStats {
    let activeGames = 0;
    let playersInGames = 0;
    for (const session of this.source.sessions()) {
      if (RUNNING_PHASES.has(session.phase)) {
        activeGames++;
        playersInGames += session.players.length;
      }
    }
    return {
      activeGames,
      playersInGames,
      playersSearching: this.source.queue().length,
    };
  }

  /** Everything the admin shows on its live page. */
  snapshot(): LiveSnapshot {
    const now = Date.now();
    const duels: LiveDuel[] = [];
    const waiting: LiveSnapshot['waiting'] = [];
    for (const session of this.source.sessions()) {
      if (session.phase === 'waiting') {
        waiting.push({
          code: session.code,
          name: session.players[0]?.name ?? '',
          since: session.phaseStartedAt,
        });
      } else if (
        RUNNING_PHASES.has(session.phase) ||
        (session.phase === 'finished' && session.phaseEndsAt !== null)
      ) {
        duels.push(toLiveDuel(session));
      }
    }
    duels.sort((a, b) => a.startedAt - b.startedAt);
    return {
      serverNow: now,
      since: this.startedAt,
      duels,
      searching: this.source.queue().map((entry) => ({
        name: entry.name,
        since: entry.since,
      })),
      waiting: waiting.sort((a, b) => a.since - b.since),
      events: [...this.events].reverse(),
      history: this.historyWindow(now),
      peak: this.peak,
      paused: this.source.paused(),
    };
  }

  record(
    session: Session,
    kind: LiveEvent['kind'],
    extra: Pick<LiveEvent, 'scores' | 'reason'> = {},
  ): void {
    this.events.push({
      id: ++this.eventId,
      at: Date.now(),
      kind,
      code: session.code,
      mode: session.mode,
      names: [...session.players, ...session.departed].map((player) => player.name),
      ...extra,
    });
    if (this.events.length > LIVE_EVENT_LIMIT) {
      this.events = this.events.slice(-LIVE_EVENT_LIMIT);
    }
  }

  /** The last hour, one sample per minute, gaps filled with zero. */
  private historyWindow(now: number): LiveSample[] {
    const minute = Math.floor(now / 60_000) * 60_000;
    const byMinute = new Map(this.history.map((sample) => [sample.at, sample]));
    const samples: LiveSample[] = [];
    for (let i = LIVE_HISTORY_MINUTES - 1; i >= 0; i--) {
      const at = minute - i * 60_000;
      samples.push(byMinute.get(at) ?? { at, games: 0, players: 0 });
    }
    return samples;
  }

  /** Keeps the highest load of each minute. */
  private sample(): void {
    const now = Date.now();
    const at = Math.floor(now / 60_000) * 60_000;
    const { activeGames, playersInGames } = this.stats();
    const last = this.history.at(-1);
    if (last?.at === at) {
      last.games = Math.max(last.games, activeGames);
      last.players = Math.max(last.players, playersInGames);
    } else {
      this.history.push({ at, games: activeGames, players: playersInGames });
      const oldest = at - LIVE_HISTORY_MINUTES * 60_000;
      this.history = this.history.filter((sample) => sample.at > oldest);
    }
    if (activeGames > 0 && activeGames > (this.peak?.games ?? 0)) {
      this.peak = { games: activeGames, at: now };
    }
  }
}

export function isRunning(session: Session): boolean {
  return RUNNING_PHASES.has(session.phase);
}

function toLiveDuel(session: Session): LiveDuel {
  const people = [...session.players, ...session.departed];
  const question =
    session.phase === 'question' || session.phase === 'reveal'
      ? session.questions[session.questionIndex]
      : undefined;
  return {
    code: session.code,
    mode: session.mode,
    phase: session.phase,
    players: people.map((player) => ({
      name: player.name,
      score: player.score,
      connected: player.socketId !== null,
      answered: player.answerIndex !== null,
    })),
    questionNumber: questionNumber(session),
    totalQuestions: totalQuestions(session),
    currentQuestion: question?.text ?? null,
    phaseEndsAt: session.phaseEndsAt,
    startedAt: session.startedAt,
    rematch: session.rematch,
    rounds: session.rounds.map((round) => ({
      questionId: round.questionId,
      text: round.text,
      options: round.options,
      correctIndex: round.correctIndex,
      answers: people.map(
        (player) =>
          round.answers.get(player.id) ?? { index: null, ms: null, points: 0 },
      ),
    })),
  };
}
