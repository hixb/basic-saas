CREATE TABLE IF NOT EXISTS "analytics_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" varchar(80) NOT NULL,
  "visitor_id" varchar(80) NOT NULL,
  "user_id" varchar(120),
  "entry_path" varchar(500) NOT NULL,
  "exit_path" varchar(500),
  "referrer" text,
  "user_agent" text,
  "device_type" varchar(40),
  "browser" varchar(80),
  "os" varchar(80),
  "language" varchar(80),
  "screen" varchar(40),
  "timezone" varchar(80),
  "ip" varchar(45),
  "country_code" varchar(10),
  "region" varchar(100),
  "country" varchar(100),
  "city" varchar(100),
  "emoji" varchar(10) DEFAULT '' NOT NULL,
  "event_count" integer DEFAULT 0 NOT NULL,
  "replay_chunk_count" integer DEFAULT 0 NOT NULL,
  "replay_size" integer DEFAULT 0 NOT NULL,
  "replay_enabled" boolean DEFAULT true NOT NULL,
  "has_replay" boolean DEFAULT false NOT NULL,
  "is_finished" boolean DEFAULT false NOT NULL,
  "duration_ms" integer DEFAULT 0 NOT NULL,
  "first_event_at" timestamp with time zone,
  "last_event_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "analytics_sessions_session_id_unique" UNIQUE("session_id")
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" varchar(80) NOT NULL,
  "visitor_id" varchar(80) NOT NULL,
  "event_id" varchar(100) NOT NULL,
  "type" varchar(60) NOT NULL,
  "name" varchar(120),
  "path" varchar(500),
  "title" varchar(300),
  "target" varchar(500),
  "value" text,
  "duration_ms" integer,
  "occurred_at" timestamp with time zone NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analytics_replay_chunks" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" varchar(80) NOT NULL,
  "chunk_index" integer NOT NULL,
  "r2_key" varchar(800) NOT NULL,
  "content_type" varchar(120) DEFAULT 'application/json' NOT NULL,
  "size" integer DEFAULT 0 NOT NULL,
  "event_count" integer DEFAULT 0 NOT NULL,
  "checksum" varchar(100),
  "start_time" timestamp with time zone,
  "end_time" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analytics_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "replay_enabled" boolean DEFAULT true NOT NULL,
  "sample_rate" integer DEFAULT 100 NOT NULL,
  "replay_sample_rate" integer DEFAULT 100 NOT NULL,
  "retention_days" integer DEFAULT 0 NOT NULL,
  "blocked_paths" jsonb DEFAULT '["/admin","/admin/login"]'::jsonb NOT NULL,
  "mask_text_selectors" jsonb DEFAULT '["[data-analytics-mask]"]'::jsonb NOT NULL,
  "block_selectors" jsonb DEFAULT '["[data-analytics-block]"]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_analytics_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("session_id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "analytics_replay_chunks" ADD CONSTRAINT "analytics_replay_chunks_session_id_analytics_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("session_id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "analytics_sessions_visitor_id_idx" ON "analytics_sessions" USING btree ("visitor_id");
CREATE INDEX IF NOT EXISTS "analytics_sessions_created_at_idx" ON "analytics_sessions" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "analytics_sessions_country_idx" ON "analytics_sessions" USING btree ("country");
CREATE INDEX IF NOT EXISTS "analytics_sessions_city_idx" ON "analytics_sessions" USING btree ("city");
CREATE INDEX IF NOT EXISTS "analytics_sessions_has_replay_idx" ON "analytics_sessions" USING btree ("has_replay");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "analytics_events_type_idx" ON "analytics_events" USING btree ("type");
CREATE INDEX IF NOT EXISTS "analytics_events_path_idx" ON "analytics_events" USING btree ("path");
CREATE INDEX IF NOT EXISTS "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");
CREATE INDEX IF NOT EXISTS "analytics_replay_chunks_session_id_idx" ON "analytics_replay_chunks" USING btree ("session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_replay_chunks_session_index_unique_idx" ON "analytics_replay_chunks" USING btree ("session_id", "chunk_index");

INSERT INTO "analytics_settings" ("id")
VALUES (1)
ON CONFLICT ("id") DO NOTHING;
