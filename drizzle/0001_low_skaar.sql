CREATE TYPE "public"."coupon_kind" AS ENUM('course_percent', 'wallet_balance', 'course_access');--> statement-breakpoint
CREATE TABLE "community_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"media_kind" text DEFAULT 'none' NOT NULL,
	"media_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_egp" integer NOT NULL,
	"method" text NOT NULL,
	"sender_name" text DEFAULT '' NOT NULL,
	"screenshot_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"issued_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "percent_off" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "kind" "coupon_kind" DEFAULT 'course_percent' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "require_sequential_progress" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_progress" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_progress" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guardian_phone" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "max_views" integer;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "replies_post_idx" ON "community_replies" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_unique" ON "coupon_redemptions" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE INDEX "payment_requests_user_idx" ON "payment_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_requests_status_idx" ON "payment_requests" USING btree ("status");--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "community_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_guardian_phone_idx" ON "users" USING btree ("guardian_phone");