export const SCHEMA_SQL = `
DO $$ BEGIN
	CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."exam_mode" AS ENUM('practice', 'graded');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."file_kind" AS ENUM('book', 'worksheet', 'exam_paper', 'attachment');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."payment_provider" AS ENUM('wallet', 'manual', 'card');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."question_kind" AS ENUM('mcq', 'true_false');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."user_role" AS ENUM('student', 'parent', 'center', 'teacher', 'admin');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."wallet_txn_kind" AS ENUM('topup', 'purchase', 'refund', 'grant');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
	CREATE TYPE "public"."coupon_kind" AS ENUM('course_percent', 'wallet_balance', 'course_access');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;


CREATE TABLE IF NOT EXISTS "academic_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "academic_stages_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL REFERENCES "academic_stages"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "grades_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"grade_id" uuid REFERENCES "grades"("id") ON DELETE set null,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"grade_id" uuid NOT NULL REFERENCES "grades"("id"),
	"subject_id" uuid NOT NULL REFERENCES "subjects"("id"),
	"teacher_id" uuid NOT NULL REFERENCES "users"("id"),
	"price_cents" integer DEFAULT 0 NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_free_preview" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE cascade,
	"youtube_video_id" text NOT NULL,
	"youtube_playlist_id" text,
	"title" text NOT NULL,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "course_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"kind" "file_kind" DEFAULT 'attachment' NOT NULL,
	"storage_key" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"is_free_preview" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "question_bank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL REFERENCES "subjects"("id"),
	"topic" text DEFAULT '' NOT NULL,
	"kind" "question_kind" DEFAULT 'mcq' NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"mode" "exam_mode" DEFAULT 'graded' NOT NULL,
	"duration_min" integer DEFAULT 20 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "exam_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL REFERENCES "exams"("id") ON DELETE cascade,
	"question_id" uuid NOT NULL REFERENCES "question_bank"("id") ON DELETE cascade,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL REFERENCES "exams"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"score" integer DEFAULT 0 NOT NULL,
	"total_marks" integer DEFAULT 0 NOT NULL,
	"answers" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone,
	"max_score" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL REFERENCES "assignments"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"storage_key" text,
	"text_answer" text,
	"score" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"kind" "coupon_kind" DEFAULT 'course_percent' NOT NULL,
	"percent_off" integer DEFAULT 0 NOT NULL,
	"amount_cents" integer,
	"max_uses" integer DEFAULT 100 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);

-- Additive migration for pre-existing databases (safe to run repeatedly).
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "kind" "coupon_kind" DEFAULT 'course_percent' NOT NULL;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "amount_cents" integer;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "course_id" uuid REFERENCES "courses"("id") ON DELETE cascade;
ALTER TABLE "coupons" ALTER COLUMN "percent_off" SET DEFAULT 0;
DO $$ BEGIN
	ALTER TYPE "public"."coupon_kind" ADD VALUE IF NOT EXISTS 'course_access';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_redemptions_unique" UNIQUE("coupon_id","user_id")
);

CREATE TABLE IF NOT EXISTS "payment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"amount_egp" integer NOT NULL,
	"method" text NOT NULL,
	"sender_name" text DEFAULT '' NOT NULL,
	"screenshot_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"issued_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid REFERENCES "users"("id") ON DELETE set null
);
CREATE INDEX IF NOT EXISTS "payment_requests_user_idx" ON "payment_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "payment_requests_status_idx" ON "payment_requests" ("status");

CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"course_id" uuid NOT NULL REFERENCES "courses"("id"),
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"coupon_id" uuid,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"provider" "payment_provider" NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"number" text NOT NULL,
	"total_cents" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"order_id" uuid,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wallet_accounts_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL REFERENCES "wallet_accounts"("id") ON DELETE cascade,
	"amount_cents" integer NOT NULL,
	"kind" "wallet_txn_kind" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "student_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
	"video_id" uuid NOT NULL REFERENCES "videos"("id") ON DELETE cascade,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'system' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid REFERENCES "courses"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"body" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "parent_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid REFERENCES "users"("id") ON DELETE set null,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;
