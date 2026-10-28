import type {
  GameQuestion,
  QuestionResult,
} from '../questions/questions.service.js';
import type { GameSettings } from '../settings/game-settings.js';
import {
  BASE_POINTS,
  MAX_SPEED_BONUS,
  type Player,
  type RoundRecord,
  type Session,
} from './game.types.js';

/** Points for a correct answer: the base, plus a bonus that shrinks with the time taken. */
export function pointsFor(
  settings: GameSettings,
  answerTimeMs: number | null,
  durationMs: number,
): number {
  if (!settings.speedBonusEnabled) {
    return BASE_POINTS;
  }
  const remainingMs = Math.max(0, durationMs - (answerTimeMs ?? durationMs));
  return BASE_POINTS + Math.round(MAX_SPEED_BONUS * (remainingMs / durationMs));
}

/**
 * What the players did with one question, for the statistics. Picks are
 * counted in the stored order of the question, not the shuffled one.
 */
export function questionResultOf(
  question: GameQuestion,
  players: readonly Player[],
): QuestionResult {
  const result: QuestionResult = {
    questionId: question.id,
    picks: question.options.map(() => 0),
    correct: 0,
    timeouts: 0,
    answerMsTotal: 0,
  };
  for (const player of players) {
    if (player.answerIndex === null) {
      result.timeouts++;
      continue;
    }
    const stored = question.order[player.answerIndex] ?? player.answerIndex;
    result.picks[stored] = (result.picks[stored] ?? 0) + 1;
    result.answerMsTotal += player.answerTimeMs ?? 0;
    if (player.answerIndex === question.correctIndex) {
      result.correct++;
    }
  }
  return result;
}

/**
 * Scores the current question for every player and records the round. The
 * players keep their new score; the reveal and the round go to the session.
 */
export function settleRound(session: Session, question: GameQuestion): void {
  const durationMs = session.settings.questionDurationSec * 1000;
  const answers = new Map<string, number | null>();
  const points = new Map<string, number>();
  const round: RoundRecord = {
    questionId: question.id,
    text: question.text,
    options: question.options,
    correctIndex: question.correctIndex,
    answers: new Map(),
  };
  for (const player of session.players) {
    const correct = player.answerIndex === question.correctIndex;
    const earned = correct
      ? pointsFor(session.settings, player.answerTimeMs, durationMs)
      : 0;
    player.score += earned;
    player.lastPoints = earned;
    answers.set(player.id, player.answerIndex);
    points.set(player.id, earned);
    round.answers.set(player.id, {
      index: player.answerIndex,
      ms: player.answerIndex === null ? null : player.answerTimeMs,
      points: earned,
    });
  }
  session.lastReveal = { correctIndex: question.correctIndex, answers, points };
  session.rounds.push(round);
}
