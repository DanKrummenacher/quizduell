import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { lastDays, zurichDay } from '../common/zurich-time.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type {
  AdminQuestion,
  QuestionDay,
  QuestionInput,
  TrashedQuestion,
} from '../contracts/admin.contract.js';
import { ADMIN_LIMITS, TRASH_DAYS } from '../contracts/admin.contract.js';
import { ANSWER_OPTION_COUNT } from '../contracts/game.contract.js';
import { DatabaseService } from '../database/database.service.js';
import {
  deletedQuestions,
  questionDaily,
  questions,
  type QuestionRow,
} from '../database/schema.js';
import { SAMPLE_QUESTIONS } from './sample-questions.js';

export interface GameQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  /** For each shown option, its index in the stored question. */
  order: number[];
}

/** What happened with one question in one duel. */
export interface QuestionResult {
  questionId: number;
  /** Picks per option in the stored order of the question. */
  picks: number[];
  correct: number;
  timeouts: number;
  answerMsTotal: number;
}

const TREND_DAYS = 14;

@Injectable()
export class QuestionsService implements OnModuleInit {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly database: DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.seedSampleQuestions && (await this.countAll()) === 0) {
      await this.importSamples();
    }
  }

  private get db() {
    return this.database.db;
  }

  async removeAll(): Promise<number> {
    await this.db.delete(deletedQuestions);
    const deleted = await this.db.delete(questions).returning({ id: questions.id });
    return deleted.length;
  }

  async importSamples(): Promise<number> {
    const inserted = await this.db
      .insert(questions)
      .values(SAMPLE_QUESTIONS.map((sample) => ({ ...sample, active: true })))
      .returning({ id: questions.id });
    return inserted.length;
  }

  async countActive(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(questions)
      .where(eq(questions.active, true));
    return row?.value ?? 0;
  }

  async countAll(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(questions);
    return row?.value ?? 0;
  }

  /** Picks `amount` random active questions, or fewer if not enough exist. */
  async pickRandom(amount: number): Promise<GameQuestion[]> {
    const rows = await this.db
      .select({
        id: questions.id,
        text: questions.text,
        options: questions.options,
        correctIndex: questions.correctIndex,
      })
      .from(questions)
      .where(eq(questions.active, true))
      .orderBy(sql`random()`)
      .limit(amount);
    return rows.map((row) => shuffleOptions(row));
  }

  async recordResults(results: QuestionResult[]): Promise<void> {
    const day = zurichDay();
    for (const result of results) {
      const answers = result.picks.reduce((sum, value) => sum + value, 0);
      const [p0 = 0, p1 = 0, p2 = 0, p3 = 0] = result.picks;
      await this.db
        .update(questions)
        .set({
          timesAsked: sql`${questions.timesAsked} + ${answers}::int`,
          timesCorrect: sql`${questions.timesCorrect} + ${result.correct}::int`,
          timeouts: sql`${questions.timeouts} + ${result.timeouts}::int`,
          answerMsTotal: sql`${questions.answerMsTotal} + ${result.answerMsTotal}::bigint`,
          picks: sql`array[
            coalesce(${questions.picks}[1], 0) + ${p0}::int,
            coalesce(${questions.picks}[2], 0) + ${p1}::int,
            coalesce(${questions.picks}[3], 0) + ${p2}::int,
            coalesce(${questions.picks}[4], 0) + ${p3}::int
          ]`,
        })
        .where(eq(questions.id, result.questionId));
      await this.db
        .insert(questionDaily)
        .values({
          questionId: result.questionId,
          day,
          answers,
          correct: result.correct,
          timeouts: result.timeouts,
          answerMsTotal: result.answerMsTotal,
        })
        .onConflictDoUpdate({
          target: [questionDaily.questionId, questionDaily.day],
          set: {
            answers: sql`${questionDaily.answers} + ${answers}::int`,
            correct: sql`${questionDaily.correct} + ${result.correct}::int`,
            timeouts: sql`${questionDaily.timeouts} + ${result.timeouts}::int`,
            answerMsTotal: sql`${questionDaily.answerMsTotal} + ${result.answerMsTotal}::bigint`,
          },
        })
        // The question may have been deleted while the duel was running.
        .catch(() => undefined);
    }
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  async listForAdmin(): Promise<AdminQuestion[]> {
    const rows = await this.db.select().from(questions).orderBy(asc(questions.id));
    const days = lastDays(TREND_DAYS * 2);
    const daily = await this.db
      .select({
        questionId: questionDaily.questionId,
        day: questionDaily.day,
        answers: questionDaily.answers,
        correct: questionDaily.correct,
      })
      .from(questionDaily)
      .where(gte(questionDaily.day, days[0]!));

    const recentFrom = days[TREND_DAYS]!;
    const trends = new Map<
      number,
      { recent: { answers: number; correct: number }; previous: typeof EMPTY }
    >();
    for (const row of daily) {
      const trend = trends.get(row.questionId) ?? {
        recent: { ...EMPTY },
        previous: { ...EMPTY },
      };
      const bucket = row.day >= recentFrom ? trend.recent : trend.previous;
      bucket.answers += row.answers;
      bucket.correct += row.correct;
      trends.set(row.questionId, trend);
    }
    return rows.map((row) => toAdminQuestion(row, trends.get(row.id)));
  }

  async getForAdmin(id: number): Promise<AdminQuestion> {
    const all = await this.listForAdmin();
    const question = all.find((q) => q.id === id);
    if (!question) {
      throw new NotFoundException();
    }
    return question;
  }

  async findRow(id: number): Promise<QuestionRow> {
    const [row] = await this.db.select().from(questions).where(eq(questions.id, id));
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  /** Answers per day for the last `days` days, oldest first, gaps filled. */
  async history(id: number, days: number): Promise<QuestionDay[]> {
    await this.findRow(id);
    const range = lastDays(days);
    const rows = await this.db
      .select()
      .from(questionDaily)
      .where(
        and(eq(questionDaily.questionId, id), gte(questionDaily.day, range[0]!)),
      );
    const byDay = new Map(rows.map((row) => [row.day, row]));
    return range.map((day) => {
      const row = byDay.get(day);
      return {
        day,
        answers: row?.answers ?? 0,
        correct: row?.correct ?? 0,
        timeouts: row?.timeouts ?? 0,
      };
    });
  }

  async create(input: QuestionInput): Promise<QuestionRow> {
    const values = normalizeQuestion(input);
    const [row] = await this.db.insert(questions).values(values).returning();
    return row!;
  }

  async update(
    id: number,
    input: QuestionInput,
    resetStats: boolean,
  ): Promise<{ before: QuestionRow; after: QuestionRow }> {
    const before = await this.findRow(id);
    const values = normalizeQuestion(input);
    const [after] = await this.db
      .update(questions)
      .set({ ...values, ...(resetStats ? RESET : {}), updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    if (resetStats) {
      await this.db.delete(questionDaily).where(eq(questionDaily.questionId, id));
    }
    return { before, after: after! };
  }

  /** Moves the question to the trash, where it can be restored for a while. */
  async remove(id: number): Promise<QuestionRow> {
    const [row] = await this.trashRows([id]);
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async setActive(ids: number[], active: boolean): Promise<number> {
    const rows = await this.db
      .update(questions)
      .set({ active, updatedAt: new Date() })
      .where(inArray(questions.id, ids))
      .returning({ id: questions.id });
    return rows.length;
  }

  async setCategory(ids: number[], category: string | null): Promise<number> {
    const value = normalizeCategory(category);
    const rows = await this.db
      .update(questions)
      .set({ category: value, updatedAt: new Date() })
      .where(inArray(questions.id, ids))
      .returning({ id: questions.id });
    return rows.length;
  }

  async removeMany(ids: number[]): Promise<number> {
    return (await this.trashRows(ids)).length;
  }

  // ---------------------------------------------------------------------------
  // Trash
  // ---------------------------------------------------------------------------

  /** Deleted questions, newest first; older than the trash keeps are gone. */
  async trash(): Promise<TrashedQuestion[]> {
    await this.purgeExpired();
    const rows = await this.db
      .select()
      .from(deletedQuestions)
      .orderBy(desc(deletedQuestions.deletedAt), desc(deletedQuestions.id));
    return rows.map((row) => {
      const question = fromStored(row.question as StoredQuestion);
      return {
        id: row.id,
        text: question.text,
        options: question.options,
        correctIndex: question.correctIndex,
        category: question.category,
        answers: question.timesAsked,
        deletedAt: row.deletedAt.toISOString(),
        expiresAt: new Date(
          row.deletedAt.getTime() + TRASH_DAYS * 86_400_000,
        ).toISOString(),
      };
    });
  }

  /** Puts a deleted question back, with its id, statistics and history. */
  async restore(id: number): Promise<QuestionRow> {
    return this.db.transaction(async (tx) => {
      const [stored] = await tx
        .delete(deletedQuestions)
        .where(eq(deletedQuestions.id, id))
        .returning();
      if (!stored) {
        throw new NotFoundException();
      }
      const [row] = await tx
        .insert(questions)
        .values(fromStored(stored.question as StoredQuestion))
        .returning();
      return row!;
    });
  }

  /** Removes questions from the trash for good; without ids, all of them. */
  async purge(ids?: number[]): Promise<number> {
    const rows = await this.db
      .delete(deletedQuestions)
      .where(ids ? inArray(deletedQuestions.id, ids) : undefined)
      .returning({ id: deletedQuestions.id });
    return rows.length;
  }

  private async trashRows(ids: number[]): Promise<QuestionRow[]> {
    if (!ids.length) {
      return [];
    }
    await this.purgeExpired();
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .delete(questions)
        .where(inArray(questions.id, ids))
        .returning();
      if (rows.length) {
        await tx
          .insert(deletedQuestions)
          .values(rows.map((row) => ({ id: row.id, question: toStored(row) })))
          .onConflictDoNothing();
      }
      return rows;
    });
  }

  private async purgeExpired(): Promise<void> {
    const cutoff = new Date(Date.now() - TRASH_DAYS * 86_400_000);
    await this.db
      .delete(deletedQuestions)
      .where(lt(deletedQuestions.deletedAt, cutoff));
  }

  async resetStats(ids: number[]): Promise<number> {
    const rows = await this.db
      .update(questions)
      .set(RESET)
      .where(inArray(questions.id, ids))
      .returning({ id: questions.id });
    await this.db
      .delete(questionDaily)
      .where(inArray(questionDaily.questionId, ids));
    return rows.length;
  }

  async importMany(
    inputs: QuestionInput[],
    skipDuplicates: boolean,
  ): Promise<{ imported: number; skipped: number }> {
    const values = inputs.map((input, index) => {
      try {
        return normalizeQuestion(input);
      } catch (error) {
        const message =
          error instanceof BadRequestException ? error.message : 'ungültig';
        throw new BadRequestException(`Zeile ${index + 1}: ${message}`);
      }
    });
    const existing = new Set(
      (await this.db.select({ text: questions.text }).from(questions)).map((row) =>
        row.text.toLocaleLowerCase('de-CH'),
      ),
    );
    const fresh: typeof values = [];
    for (const value of values) {
      const key = value.text.toLocaleLowerCase('de-CH');
      if (skipDuplicates && existing.has(key)) {
        continue;
      }
      existing.add(key);
      fresh.push(value);
    }
    if (fresh.length > 0) {
      await this.db.insert(questions).values(fresh);
    }
    return { imported: fresh.length, skipped: values.length - fresh.length };
  }
}

const EMPTY = { answers: 0, correct: 0 };

const RESET = {
  timesAsked: 0,
  timesCorrect: 0,
  timeouts: 0,
  answerMsTotal: 0,
  picks: [0, 0, 0, 0],
};

type StoredQuestion = Omit<QuestionRow, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toStored(row: QuestionRow): StoredQuestion {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fromStored(stored: StoredQuestion): QuestionRow {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

function toAdminQuestion(
  row: QuestionRow,
  trend?: {
    recent: { answers: number; correct: number };
    previous: { answers: number; correct: number };
  },
): AdminQuestion {
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    correctIndex: row.correctIndex,
    category: row.category,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    stats: {
      answers: row.timesAsked,
      correct: row.timesCorrect,
      timeouts: row.timeouts,
      picks: row.options.map((_, index) => row.picks[index] ?? 0),
      avgAnswerMs:
        row.timesAsked > 0 && row.answerMsTotal > 0
          ? Math.round(row.answerMsTotal / row.timesAsked)
          : null,
      recent: trend?.recent ?? { ...EMPTY },
      previous: trend?.previous ?? { ...EMPTY },
    },
  };
}

/** Trims and checks a question; throws a readable German message. */
export function normalizeQuestion(input: QuestionInput): {
  text: string;
  options: string[];
  correctIndex: number;
  category: string | null;
  active: boolean;
} {
  const text = collapse(input.text);
  if (!text) {
    throw new BadRequestException('Die Frage ist leer.');
  }
  if (text.length > ADMIN_LIMITS.questionText) {
    throw new BadRequestException(
      `Die Frage ist länger als ${ADMIN_LIMITS.questionText} Zeichen.`,
    );
  }
  const options = input.options.map(collapse);
  if (options.length !== ANSWER_OPTION_COUNT) {
    throw new BadRequestException(
      `Es braucht genau ${ANSWER_OPTION_COUNT} Antworten.`,
    );
  }
  if (options.some((option) => !option)) {
    throw new BadRequestException('Eine Antwort ist leer.');
  }
  if (options.some((option) => option.length > ADMIN_LIMITS.optionText)) {
    throw new BadRequestException(
      `Eine Antwort ist länger als ${ADMIN_LIMITS.optionText} Zeichen.`,
    );
  }
  const unique = new Set(options.map((option) => option.toLocaleLowerCase('de-CH')));
  if (unique.size !== options.length) {
    throw new BadRequestException('Zwei Antworten sind gleich.');
  }
  if (
    !Number.isInteger(input.correctIndex) ||
    input.correctIndex < 0 ||
    input.correctIndex >= ANSWER_OPTION_COUNT
  ) {
    throw new BadRequestException('Die richtige Antwort fehlt.');
  }
  return {
    text,
    options,
    correctIndex: input.correctIndex,
    category: normalizeCategory(input.category),
    active: input.active,
  };
}

function normalizeCategory(category: string | null | undefined): string | null {
  const value = collapse(category ?? '');
  if (value.length > ADMIN_LIMITS.category) {
    throw new BadRequestException(
      `Die Kategorie ist länger als ${ADMIN_LIMITS.category} Zeichen.`,
    );
  }
  return value || null;
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Shuffles the answer options so the correct answer is not always in the same slot. */
function shuffleOptions(question: Omit<GameQuestion, 'order'>): GameQuestion {
  const order = question.options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return {
    id: question.id,
    text: question.text,
    options: order.map((index) => question.options[index]!),
    correctIndex: order.indexOf(question.correctIndex),
    order,
  };
}
