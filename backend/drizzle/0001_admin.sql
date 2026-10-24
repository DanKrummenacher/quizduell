CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" varchar(40) NOT NULL,
	"summary" varchar(300) NOT NULL,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "dismissed_hints" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_daily" (
	"question_id" integer NOT NULL,
	"day" date NOT NULL,
	"answers" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"timeouts" integer DEFAULT 0 NOT NULL,
	"answer_ms_total" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "question_daily_question_id_day_pk" PRIMARY KEY("question_id","day")
);
--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "status" varchar(10) DEFAULT 'finished' NOT NULL;--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "end_reason" varchar(30);--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "questions_played" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "rematch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "played_games" ADD COLUMN "scores" integer[];--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "picks" integer[] DEFAULT '{0,0,0,0}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "timeouts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "answer_ms_total" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "question_daily_day_idx" ON "question_daily" USING btree ("day");
--> statement-breakpoint
UPDATE "played_games" SET "questions_played" = "question_count";