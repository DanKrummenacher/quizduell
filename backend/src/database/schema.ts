import {
  boolean,
  index,
  integer,
  pgTable,
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
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const playedGames = pgTable(
  'played_games',
  {
    id: serial('id').primaryKey(),
    mode: varchar('mode', { length: 10 }).notNull(),
    questionCount: smallint('question_count').notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('played_games_finished_at_idx').on(table.finishedAt)],
);

export type QuestionRow = typeof questions.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
