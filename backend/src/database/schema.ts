import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const questions = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    text: varchar('text', { length: 300 }).notNull(),
    options: text('options').array().notNull(),
    correctIndex: smallint('correct_index').notNull(),
    category: varchar('category', { length: 50 }),
    active: boolean('active').notNull().default(true),
    timesAsked: integer('times_asked').notNull().default(0),
    timesCorrect: integer('times_correct').notNull().default(0),
    /** How often each option was picked, in the stored order of `options`. */
    picks: integer('picks')
      .array()
      .notNull()
      .default(sql`'{0,0,0,0}'::integer[]`),
    /** Players who let the time run out without answering. */
    timeouts: integer('timeouts').notNull().default(0),
    /** Sum of the answer times of all given answers, for the average. */
    answerMsTotal: bigint('answer_ms_total', { mode: 'number' })
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('questions_active_idx').on(table.active)],
);

/** Single-row table (id = 1) holding the game settings. */
export const settings = pgTable('settings', {
  id: smallint('id').primaryKey(),
  questionsPerGame: smallint('questions_per_game').notNull(),
  questionDurationSec: smallint('question_duration_sec').notNull(),
  revealDurationSec: smallint('reveal_duration_sec').notNull(),
  speedBonusEnabled: boolean('speed_bonus_enabled').notNull(),
  rematchTimeoutSec: smallint('rematch_timeout_sec').notNull(),
  idleResetSec: smallint('idle_reset_sec').notNull(),
  /** No new duels start while true; running duels play to the end. */
  paused: boolean('paused').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One row per duel that started, written when it finished or was aborted. */
export const playedGames = pgTable(
  'played_games',
  {
    id: serial('id').primaryKey(),
    mode: varchar('mode', { length: 10 }).notNull(),
    questionCount: smallint('question_count').notNull(),
    /** `finished` or `aborted`. */
    status: varchar('status', { length: 10 }).notNull().default('finished'),
    /** Why an aborted duel ended (`opponent-left`, `opponent-disconnected`, …). */
    endReason: varchar('end_reason', { length: 30 }),
    /** Questions that were revealed before the duel ended. */
    questionsPlayed: smallint('questions_played').notNull().default(0),
    /** The duel was a rematch of the previous one. */
    rematch: boolean('rematch').notNull().default(false),
    durationMs: integer('duration_ms'),
    /** Final scores, highest first. */
    scores: integer('scores').array(),
    /** When the duel ended; named before aborted duels were recorded. */
    finishedAt: timestamp('finished_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('played_games_finished_at_idx').on(table.finishedAt)],
);

/**
 * Answers per question and day (Europe/Zurich), for trends over time. Rows of
 * deleted questions stay, so the totals of past days do not change.
 */
export const questionDaily = pgTable(
  'question_daily',
  {
    questionId: integer('question_id').notNull(),
    day: date('day', { mode: 'string' }).notNull(),
    answers: integer('answers').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    timeouts: integer('timeouts').notNull().default(0),
    answerMsTotal: bigint('answer_ms_total', { mode: 'number' })
      .notNull()
      .default(0),
  },
  (table) => [
    primaryKey({ columns: [table.questionId, table.day] }),
    index('question_daily_day_idx').on(table.day),
  ],
);

/** Every change made in the admin, newest first. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    action: varchar('action', { length: 40 }).notNull(),
    summary: varchar('summary', { length: 300 }).notNull(),
    /** Values before and after, e.g. to restore earlier settings. */
    detail: jsonb('detail'),
  },
  (table) => [index('audit_log_at_idx').on(table.at)],
);

/**
 * Deleted questions, kept with all their values for a while so they can be
 * restored under their old id; the daily rows in `question_daily` stay anyway.
 */
export const deletedQuestions = pgTable(
  'deleted_questions',
  {
    id: integer('id').primaryKey(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** The question row as it was, dates as ISO strings. */
    question: jsonb('question').notNull(),
  },
  (table) => [index('deleted_questions_deleted_at_idx').on(table.deletedAt)],
);

/** The one admin password, hashed; a single row (id = 1). */
export const adminCredentials = pgTable('admin_credentials', {
  id: smallint('id').primaryKey(),
  /** `scrypt$<salt>$<hash>`, both base64url. */
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Hints the admin decided to ignore. */
export const dismissedHints = pgTable('dismissed_hints', {
  key: varchar('key', { length: 80 }).primaryKey(),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type QuestionRow = typeof questions.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type PlayedGameRow = typeof playedGames.$inferSelect;
export type AuditRow = typeof auditLog.$inferSelect;
