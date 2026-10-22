import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { count, eq, sql } from 'drizzle-orm';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DatabaseService } from '../database/database.service.js';
import { questions } from '../database/schema.js';
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
