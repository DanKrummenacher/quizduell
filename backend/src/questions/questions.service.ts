import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, eq, sql } from 'drizzle-orm';
import type { AdminQuestion, QuestionInput } from '../contracts/admin.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { questions, type QuestionRow } from '../database/schema.js';
import { SAMPLE_QUESTIONS } from './sample-questions.js';

export interface GameQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface QuestionResult {
  questionId: number;
  answers: number;
  correctAnswers: number;
}

@Injectable()
export class QuestionsService {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.db;
  }

  async list(): Promise<AdminQuestion[]> {
    const rows = await this.db.select().from(questions).orderBy(asc(questions.id));
    return rows.map(toAdminQuestion);
  }

  async create(input: QuestionInput): Promise<AdminQuestion> {
    const [row] = await this.db.insert(questions).values(toRow(input)).returning();
    return toAdminQuestion(row!);
  }

  async update(id: number, input: QuestionInput): Promise<AdminQuestion> {
    const [row] = await this.db
      .update(questions)
      .set({ ...toRow(input), updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    if (!row) {
      throw new NotFoundException();
    }
    return toAdminQuestion(row);
  }

  async setActive(id: number, active: boolean): Promise<AdminQuestion> {
    const [row] = await this.db
      .update(questions)
      .set({ active, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    if (!row) {
      throw new NotFoundException();
    }
    return toAdminQuestion(row);
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });
    if (deleted.length === 0) {
      throw new NotFoundException();
    }
  }

  async removeAll(): Promise<number> {
    const deleted = await this.db.delete(questions).returning({ id: questions.id });
    return deleted.length;
  }

  async importSamples(): Promise<number> {
    const inserted = await this.db
      .insert(questions)
      .values(SAMPLE_QUESTIONS.map((sample) => toRow({ ...sample, active: true })))
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
    for (const result of results) {
      await this.db
        .update(questions)
        .set({
          timesAsked: sql`${questions.timesAsked} + ${result.answers}`,
          timesCorrect: sql`${questions.timesCorrect} + ${result.correctAnswers}`,
        })
        .where(eq(questions.id, result.questionId));
    }
  }
}

/** Shuffles the answer options so the correct answer is not always in the same slot. */
function shuffleOptions(question: GameQuestion): GameQuestion {
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
  };
}

function toRow(input: QuestionInput) {
  return {
    text: input.text,
    options: input.options,
    correctIndex: input.correctIndex,
    category: input.category,
    active: input.active,
  };
}

function toAdminQuestion(row: QuestionRow): AdminQuestion {
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    correctIndex: row.correctIndex,
    category: row.category,
    active: row.active,
    timesAsked: row.timesAsked,
    timesCorrect: row.timesCorrect,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
