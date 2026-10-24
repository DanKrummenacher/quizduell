import { Injectable } from '@nestjs/common';
import { and, count, eq, gte, sql, sum } from 'drizzle-orm';
import {
  lastDays,
  zurichDay,
  zurichMidnight,
  zurichWeekdayHour,
} from '../common/zurich-time.js';
import type {
  Analytics,
  AnalyticsDay,
  AnalyticsRange,
  CategoryStats,
  PeriodTotals,
} from '../contracts/admin.contract.js';
import type { EndReason, GameMode } from '../contracts/game.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { playedGames, questionDaily, questions } from '../database/schema.js';

interface HourBucket {
  hour: Date;
  status: string;
  mode: string;
  rematch: boolean;
  games: number;
  durationMs: number;
}

/** Figures of a period and the period of the same length just before. */
@Injectable()
export class AnalyticsService {
  constructor(private readonly database: DatabaseService) {}

  async get(range: AnalyticsRange): Promise<Analytics> {
    const days = lastDays(range * 2);
    const previousDays = days.slice(0, range);
    const currentDays = days.slice(range);
    const from = zurichMidnight(days[0]!);
    const currentFrom = zurichMidnight(currentDays[0]!);

    const [buckets, answerRows, abortRows, categories] = await Promise.all([
      this.hourBuckets(from),
      this.answersPerDay(days[0]!),
      this.aborts(currentFrom),
      this.categories(),
    ]);

    const perDay = new Map<string, AnalyticsDay>(
      days.map((day) => [
        day,
        { day, finished: 0, aborted: 0, answers: 0, correct: 0, timeouts: 0 },
      ]),
    );
    const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    const modes: Record<GameMode, number> = { quick: 0, friend: 0 };
    const totals = { current: emptyTotals(), previous: emptyTotals() };
    const durations = {
      current: { sum: 0, count: 0 },
      previous: { sum: 0, count: 0 },
    };

    for (const bucket of buckets) {
      const day = zurichDay(bucket.hour);
      const entry = perDay.get(day);
      if (!entry) {
        continue;
      }
      const period = day >= currentDays[0]! ? 'current' : 'previous';
      const target = totals[period];
      target.games += bucket.games;
      if (bucket.status === 'finished') {
        entry.finished += bucket.games;
        target.finished += bucket.games;
        durations[period].sum += bucket.durationMs;
        durations[period].count += bucket.games;
      } else {
        entry.aborted += bucket.games;
        target.aborted += bucket.games;
      }
      if (bucket.rematch) {
        target.rematches += bucket.games;
      }
      if (period === 'current') {
        const { weekday, hour } = zurichWeekdayHour(bucket.hour);
        heatmap[weekday]![hour]! += bucket.games;
        if (bucket.mode === 'quick' || bucket.mode === 'friend') {
          modes[bucket.mode] += bucket.games;
        }
      }
    }

    const answerMs = {
      current: { sum: 0, count: 0 },
      previous: { sum: 0, count: 0 },
    };
    for (const row of answerRows) {
      const entry = perDay.get(row.day);
      if (!entry) {
        continue;
      }
      entry.answers += row.answers;
      entry.correct += row.correct;
      entry.timeouts += row.timeouts;
      const period = row.day >= currentDays[0]! ? 'current' : 'previous';
      totals[period].answers += row.answers;
      totals[period].correct += row.correct;
      totals[period].timeouts += row.timeouts;
      answerMs[period].sum += row.answerMsTotal;
      answerMs[period].count += row.answers;
    }

    for (const period of ['current', 'previous'] as const) {
      totals[period].avgDurationMs = average(durations[period]);
      totals[period].avgAnswerMs = average(answerMs[period]);
    }

    const reasons = new Map<EndReason, number>();
    const abortsByQuestion: number[] = [];
    for (const row of abortRows) {
      const reason = (row.reason ?? 'opponent-left') as EndReason;
      reasons.set(reason, (reasons.get(reason) ?? 0) + row.count);
      const at = Math.max(0, row.questionsPlayed);
      while (abortsByQuestion.length <= at) {
        abortsByQuestion.push(0);
      }
      abortsByQuestion[at]! += row.count;
    }

    return {
      range,
      current: totals.current,
      previous: totals.previous,
      days: currentDays.map((day) => perDay.get(day)!),
      previousDays: previousDays.map((day) => perDay.get(day)!),
      heatmap,
      modes,
      endReasons: [...reasons].map(([reason, value]) => ({ reason, count: value })),
      abortsByQuestion,
      categories,
    };
  }

  private async hourBuckets(from: Date): Promise<HourBucket[]> {
    const hour = sql<string>`date_trunc('hour', ${playedGames.finishedAt})`;
    const rows = await this.database.db
      .select({
        hour,
        status: playedGames.status,
        mode: playedGames.mode,
        rematch: playedGames.rematch,
        games: count(),
        durationMs: sum(playedGames.durationMs),
      })
      .from(playedGames)
      .where(gte(playedGames.finishedAt, from))
      .groupBy(hour, playedGames.status, playedGames.mode, playedGames.rematch);
    return rows.map((row) => ({
      hour: new Date(row.hour),
      status: row.status,
      mode: row.mode,
      rematch: row.rematch,
      games: Number(row.games),
      durationMs: Number(row.durationMs ?? 0),
    }));
  }

  private async answersPerDay(from: string) {
    const rows = await this.database.db
      .select({
        day: questionDaily.day,
        answers: sum(questionDaily.answers),
        correct: sum(questionDaily.correct),
        timeouts: sum(questionDaily.timeouts),
        answerMsTotal: sum(questionDaily.answerMsTotal),
      })
      .from(questionDaily)
      .where(gte(questionDaily.day, from))
      .groupBy(questionDaily.day);
    return rows.map((row) => ({
      day: row.day,
      answers: Number(row.answers ?? 0),
      correct: Number(row.correct ?? 0),
      timeouts: Number(row.timeouts ?? 0),
      answerMsTotal: Number(row.answerMsTotal ?? 0),
    }));
  }

  private async aborts(from: Date) {
    const rows = await this.database.db
      .select({
        reason: playedGames.endReason,
        questionsPlayed: playedGames.questionsPlayed,
        count: count(),
      })
      .from(playedGames)
      .where(
        and(eq(playedGames.status, 'aborted'), gte(playedGames.finishedAt, from)),
      )
      .groupBy(playedGames.endReason, playedGames.questionsPlayed);
    return rows.map((row) => ({ ...row, count: Number(row.count) }));
  }

  private async categories(): Promise<CategoryStats[]> {
    const rows = await this.database.db
      .select({
        category: questions.category,
        questions: count(),
        active: sql<number>`count(*) filter (where ${questions.active})`,
        answers: sum(questions.timesAsked),
        correct: sum(questions.timesCorrect),
      })
      .from(questions)
      .groupBy(questions.category);
    return rows
      .map((row) => ({
        category: row.category,
        questions: Number(row.questions),
        active: Number(row.active),
        answers: Number(row.answers ?? 0),
        correct: Number(row.correct ?? 0),
      }))
      .sort((a, b) => b.questions - a.questions);
  }
}

function emptyTotals(): PeriodTotals {
  return {
    games: 0,
    finished: 0,
    aborted: 0,
    rematches: 0,
    answers: 0,
    correct: 0,
    timeouts: 0,
    avgDurationMs: null,
    avgAnswerMs: null,
  };
}

function average({ sum: total, count: amount }: { sum: number; count: number }) {
  return amount > 0 ? Math.round(total / amount) : null;
}
