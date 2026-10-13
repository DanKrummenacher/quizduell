CREATE TABLE "played_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" varchar(10) NOT NULL,
	"question_count" smallint NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(300) NOT NULL,
	"options" text[] NOT NULL,
	"correct_index" smallint NOT NULL,
	"category" varchar(50),
	"active" boolean DEFAULT true NOT NULL,
	"times_asked" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" smallint PRIMARY KEY NOT NULL,
	"questions_per_game" smallint NOT NULL,
	"question_duration_sec" smallint NOT NULL,
	"reveal_duration_sec" smallint NOT NULL,
	"speed_bonus_enabled" boolean NOT NULL,
	"rematch_timeout_sec" smallint NOT NULL,
	"idle_reset_sec" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "played_games_finished_at_idx" ON "played_games" USING btree ("finished_at");--> statement-breakpoint
CREATE INDEX "questions_active_idx" ON "questions" USING btree ("active");