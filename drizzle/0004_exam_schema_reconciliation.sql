DO $$ BEGIN
	CREATE TYPE "public"."exam_type" AS ENUM('graded', 'practice', 'quiz', 'surprise', 'final', 'diagnostic');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "group_id" uuid;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "type" "exam_type" DEFAULT 'graded' NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "available_from" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "available_until" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "per_question_sec" integer;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "max_attempts" integer;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "passing_score" integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "shuffle_questions" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "show_results_immediately" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "prerequisite_exam_id" uuid;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "exam_attempt_starts" ADD COLUMN IF NOT EXISTS "attempt_id" uuid;
--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN IF NOT EXISTS "course_id" uuid;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qb_course_idx" ON "question_bank" USING btree ("course_id");
