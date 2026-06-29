CREATE TABLE IF NOT EXISTS "material_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "slug" varchar(80) NOT NULL,
  "description" varchar(500),
  "status" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "material_categories_slug_unique_idx" ON "material_categories" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "material_categories_status_idx" ON "material_categories" USING btree ("status");
CREATE INDEX IF NOT EXISTS "material_categories_created_at_idx" ON "material_categories" USING btree ("created_at");

INSERT INTO "material_categories" ("name", "slug", "description", "status")
VALUES
  ('Marketplace', 'marketplace', 'Marketplace launch and catalog operations.', 1),
  ('Logistics', 'logistics', 'Warehouse, shipping, and fulfillment handoff materials.', 1),
  ('Compliance', 'compliance', 'Compliance, document, and risk review resources.', 1),
  ('Playbook', 'playbook', 'Reusable operating playbooks and checklists.', 1)
ON CONFLICT ("slug") DO NOTHING;
