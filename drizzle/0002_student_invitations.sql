CREATE TABLE IF NOT EXISTS "student_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_invitations" ADD CONSTRAINT "student_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_invitations_email_idx" ON "student_invitations" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_invitations_expiry_idx" ON "student_invitations" USING btree ("expires_at");
