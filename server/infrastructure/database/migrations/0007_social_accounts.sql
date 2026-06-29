CREATE TABLE IF NOT EXISTS "social_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "platform" varchar(30) NOT NULL,
  "platform_account_id" varchar(255),
  "access_token" varchar(4000) NOT NULL,
  "refresh_token" varchar(4000),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "social_accounts_user_id_idx" ON "social_accounts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "social_accounts_platform_idx" ON "social_accounts" USING btree ("platform");
