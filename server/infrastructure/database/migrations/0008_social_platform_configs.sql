CREATE TABLE IF NOT EXISTS "social_platform_configs" (
  "id" serial PRIMARY KEY NOT NULL,
  "platform" varchar(30) NOT NULL,
  "display_name" varchar(120) NOT NULL,
  "client_id" varchar(500) NOT NULL,
  "client_secret" varchar(1000) NOT NULL,
  "auth_url" varchar(1000) NOT NULL,
  "token_url" varchar(1000) NOT NULL,
  "api_base_url" varchar(1000) NOT NULL,
  "publish_endpoint" varchar(1000),
  "upload_endpoint" varchar(1000),
  "scopes" text DEFAULT '' NOT NULL,
  "status" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_platform_configs_platform_unique_idx" ON "social_platform_configs" USING btree ("platform");
CREATE INDEX IF NOT EXISTS "social_platform_configs_status_idx" ON "social_platform_configs" USING btree ("status");

INSERT INTO "social_platform_configs" (
  "platform",
  "display_name",
  "client_id",
  "client_secret",
  "auth_url",
  "token_url",
  "api_base_url",
  "publish_endpoint",
  "upload_endpoint",
  "scopes",
  "status"
)
VALUES
  (
    'facebook',
    'Facebook',
    'configure-facebook-client-id',
    'configure-facebook-client-secret',
    'https://www.facebook.com/v20.0/dialog/oauth',
    'https://graph.facebook.com/v20.0/oauth/access_token',
    'https://graph.facebook.com',
    '/{page-id}/feed',
    NULL,
    'pages_manage_posts,pages_read_engagement',
    1
  ),
  (
    'youtube',
    'YouTube',
    'configure-youtube-client-id',
    'configure-youtube-client-secret',
    'https://accounts.google.com/o/oauth2/v2/auth',
    'https://oauth2.googleapis.com/token',
    'https://www.googleapis.com',
    NULL,
    '/upload/youtube/v3/videos?uploadType=resumable',
    'https://www.googleapis.com/auth/youtube.upload',
    1
  ),
  (
    'tiktok',
    'TikTok',
    'configure-tiktok-client-id',
    'configure-tiktok-client-secret',
    'https://www.tiktok.com/v2/auth/authorize/',
    'https://open.tiktokapis.com/v2/oauth/token/',
    'https://open.tiktokapis.com',
    NULL,
    NULL,
    'video.upload,video.publish',
    2
  )
ON CONFLICT DO NOTHING;
