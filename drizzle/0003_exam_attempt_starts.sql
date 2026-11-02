CREATE TABLE IF NOT EXISTS "exam_attempt_starts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"question_order" jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"attempt_id" uuid
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "exam_attempt_starts" ADD CONSTRAINT "exam_attempt_starts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "exam_attempt_starts" ADD CONSTRAINT "exam_attempt_starts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "exam_attempt_starts" ADD CONSTRAINT "exam_attempt_starts_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_starts_exam_user_idx" ON "exam_attempt_starts" USING btree ("exam_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_starts_expiry_idx" ON "exam_attempt_starts" USING btree ("expires_at");
