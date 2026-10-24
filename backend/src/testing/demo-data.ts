import { eq } from 'drizzle-orm';
import { lastDays, zurichMidnight } from '../common/zurich-time.js';
import type { DatabaseService } from '../database/database.service.js';
import { playedGames, questionDaily, questions } from '../database/schema.js';

/** Deterministic pseudo random numbers, so demo data looks the same every time. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/** Typical load per hour of the day, a fair or office pattern. */
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0, 0, 0.2, 0.6, 1, 1.2, 1.3, 1.1, 1, 1.2, 1.4, 1.3, 1, 0.6, 0.3,
  0.15, 0.05, 0, 0,
];

/**
 * Replaces all duels and answer figures with 60 days of plausible duels and answers, for local
 * development and screenshots of the admin. Only reachable via TEST_CONTROL.
 */
export async function generateDemoData(database: DatabaseService): Promise<number> {
  const { db } = database;
  const next = random(42);
  const all = await db.select().from(questions);
  if (all.length === 0) {
    return 0;
  }
  // Replaces earlier figures, so loading the demo twice does not double them.
  await db.delete(playedGames);
  await db.delete(questionDaily);
  // Each question gets a character: how hard it is and whether it lures.
  const profiles = all.map((question, index) => ({
    question,
    rate: index % 11 === 3 ? 0.22 : index % 9 === 5 ? 0.97 : 0.45 + next() * 0.45,
    lure: index % 13 === 7,
    slow: index % 10 === 4,
  }));

  const days = lastDays(60);
  const games: (typeof playedGames.$inferInsert)[] = [];
  const daily = new Map<string, typeof questionDaily.$inferInsert>();
  const totals = new Map<
    number,
    { picks: number[]; timeouts: number; ms: number }
  >();

  days.forEach((day, dayIndex) => {
    const date = zurichMidnight(day);
    const weekday = (date.getUTCDay() + 6) % 7;
    const trend = 0.6 + (dayIndex / days.length) * 0.6;
    const base = (weekday >= 5 ? 4 : 14) * trend;
    for (let hour = 0; hour < 24; hour++) {
      const expected = base * HOUR_WEIGHTS[hour]!;
      const count = Math.round(expected * (0.6 + next() * 0.8));
      for (let n = 0; n < count; n++) {
        const finishedAt = new Date(
          date.getTime() + hour * 3_600_000 + Math.floor(next() * 3_600_000),
        );
        const aborted = next() < 0.09;
        const questionCount = 7;
        const played = aborted ? Math.floor(next() * questionCount) : questionCount;
        let scoreA = 0;
        let scoreB = 0;
        for (let q = 0; q < played; q++) {
          const profile = profiles[Math.floor(next() * profiles.length)]!;
          const key = `${profile.question.id}:${day}`;
          const row = daily.get(key) ?? {
            questionId: profile.question.id,
            day,
            answers: 0,
            correct: 0,
            timeouts: 0,
            answerMsTotal: 0,
          };
          const total = totals.get(profile.question.id) ?? {
            picks: [0, 0, 0, 0],
            timeouts: 0,
            ms: 0,
          };
          for (let player = 0; player < 2; player++) {
            if (next() < (profile.slow ? 0.26 : 0.04)) {
              row.timeouts! += 1;
              total.timeouts += 1;
              continue;
            }
            const correct = next() < profile.rate;
            const wrong =
              (profile.question.correctIndex +
                1 +
                (profile.lure ? 0 : Math.floor(next() * 3))) %
              4;
            const pick = correct ? profile.question.correctIndex : wrong;
            const ms = Math.round(2_500 + next() * (profile.slow ? 15_000 : 9_000));
            row.answers! += 1;
            row.correct! += correct ? 1 : 0;
            row.answerMsTotal! += ms;
            total.picks[pick]! += 1;
            total.ms += ms;
            const points = correct ? 100 + Math.round(next() * 100) : 0;
            if (player === 0) {
              scoreA += points;
            } else {
              scoreB += points;
            }
          }
          daily.set(key, row);
          totals.set(profile.question.id, total);
        }
        games.push({
          mode: next() < 0.72 ? 'quick' : 'friend',
          questionCount,
          status: aborted ? 'aborted' : 'finished',
          endReason: aborted
            ? next() < 0.7
              ? 'opponent-left'
              : 'opponent-disconnected'
            : null,
          questionsPlayed: played,
          rematch: !aborted && next() < 0.18,
          durationMs: Math.round(played * 9_000 + 3_000 + next() * 40_000),
          scores: [scoreA, scoreB].sort((a, b) => b - a),
          finishedAt,
        });
      }
    }
  });

  for (let i = 0; i < games.length; i += 500) {
    await db.insert(playedGames).values(games.slice(i, i + 500));
  }
  const rows = [...daily.values()];
  for (let i = 0; i < rows.length; i += 500) {
    await db.insert(questionDaily).values(rows.slice(i, i + 500));
  }
  for (const [id, total] of totals) {
    const answers = total.picks.reduce((a, b) => a + b, 0);
    const question = all.find((q) => q.id === id)!;
    await db
      .update(questions)
      .set({
        picks: total.picks,
        timesAsked: answers,
        timesCorrect: total.picks[question.correctIndex] ?? 0,
        timeouts: total.timeouts,
        answerMsTotal: total.ms,
      })
      .where(eq(questions.id, id));
  }
  return games.length;
}
