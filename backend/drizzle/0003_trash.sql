CREATE TABLE "deleted_questions" (
	"id" integer PRIMARY KEY NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "deleted_questions_deleted_at_idx" ON "deleted_questions" USING btree ("deleted_at");