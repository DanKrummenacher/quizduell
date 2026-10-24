import { Injectable } from '@nestjs/common';
import type {
  AdminQuestion,
  Hint,
  HintSeverity,
} from '../contracts/admin.contract.js';
import { eq, like } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { dismissedHints } from '../database/schema.js';
import { QuestionsService } from '../questions/questions.service.js';
import { SettingsService } from '../settings/settings.service.js';

/** Answers a question needs before its values are trusted. */
export const HINT_MIN_SAMPLE = 20;
/** Below this many duels' worth of questions, players see repeats soon. */
export const POOL_SMALL_FACTOR = 4;
export const HARD_BELOW = 0.3;
export const EASY_FROM = 0.95;
export const EASY_MIN_SAMPLE = 30;
export const LURE_FROM = 0.3;
export const TIMEOUTS_FROM = 0.2;

const SEVERITY_ORDER: Record<HintSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

/**
 * Finds what needs attention: too few questions, questions that mislead,
 * are too hard, too easy or too long for the time. Ignored hints stay
 * listed with `ignored: true`.
 */
@Injectable()
export class HintsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly questionsService: QuestionsService,
    private readonly settingsService: SettingsService,
  ) {}

  async list(questions?: AdminQuestion[]): Promise<Hint[]> {
    const all = questions ?? (await this.questionsService.listForAdmin());
    const ignored = new Set(
      (await this.database.db.select().from(dismissedHints)).map((row) => row.key),
    );
    return detectHints(all, this.settingsService.get().questionsPerGame)
      .map((hint) => ({ ...hint, ignored: ignored.has(hint.key) }))
      .sort(
        (a, b) =>
          SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
          b.sample - a.sample,
      );
  }

  async ignore(key: string): Promise<void> {
    await this.database.db
      .insert(dismissedHints)
      .values({ key })
      .onConflictDoNothing();
  }

  async restore(key: string): Promise<void> {
    await this.database.db.delete(dismissedHints).where(eq(dismissedHints.key, key));
  }

  /** Drops what was ignored for a deleted question. */
  async forgetQuestion(id: number): Promise<void> {
    await this.database.db
      .delete(dismissedHints)
      .where(like(dismissedHints.key, `%:${id}`));
  }
}

export function detectHints(
  questions: AdminQuestion[],
  questionsPerGame: number,
): Omit<Hint, 'ignored'>[] {
  const hints: Omit<Hint, 'ignored'>[] = [];
  const active = questions.filter((q) => q.active);

  if (active.length < questionsPerGame) {
    hints.push({
      key: 'pool-empty',
      type: 'pool-empty',
      severity: 'critical',
      questionId: null,
      value: active.length,
      sample: questionsPerGame,
    });
  } else if (active.length < questionsPerGame * POOL_SMALL_FACTOR) {
    hints.push({
      key: 'pool-small',
      type: 'pool-small',
      severity: 'medium',
      questionId: null,
      value: active.length,
      sample: questionsPerGame * POOL_SMALL_FACTOR,
    });
  }

  for (const question of active) {
    const { answers, correct, timeouts, picks } = question.stats;
    const picked = picks.reduce((sum, value) => sum + value, 0);

    if (picked >= HINT_MIN_SAMPLE) {
      const correctShare = (picks[question.correctIndex] ?? 0) / picked;
      let lure = -1;
      picks.forEach((value, index) => {
        if (index !== question.correctIndex && value > (picks[lure] ?? -1)) {
          lure = index;
        }
      });
      const lureShare = (picks[lure] ?? 0) / picked;
      if (lure >= 0 && lureShare >= LURE_FROM && lureShare > correctShare) {
        hints.push({
          key: `lure:${question.id}`,
          type: 'lure',
          severity: 'high',
          questionId: question.id,
          value: lureShare,
          sample: picked,
          optionIndex: lure,
        });
        continue;
      }
    }

    if (answers >= HINT_MIN_SAMPLE && correct / answers < HARD_BELOW) {
      hints.push({
        key: `hard:${question.id}`,
        type: 'hard',
        severity: 'high',
        questionId: question.id,
        value: correct / answers,
        sample: answers,
      });
    } else if (answers >= EASY_MIN_SAMPLE && correct / answers >= EASY_FROM) {
      hints.push({
        key: `easy:${question.id}`,
        type: 'easy',
        severity: 'medium',
        questionId: question.id,
        value: correct / answers,
        sample: answers,
      });
    }

    const shown = answers + timeouts;
    if (shown >= HINT_MIN_SAMPLE && timeouts / shown >= TIMEOUTS_FROM) {
      hints.push({
        key: `timeouts:${question.id}`,
        type: 'timeouts',
        severity: 'medium',
        questionId: question.id,
        value: timeouts / shown,
        sample: shown,
      });
    }
  }
  return hints;
}
