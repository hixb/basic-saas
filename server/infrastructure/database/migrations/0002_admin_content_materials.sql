ALTER TABLE "uploaded_materials" RENAME COLUMN "company_name" TO "title";
ALTER TABLE "uploaded_materials" RENAME COLUMN "material_type" TO "category";
ALTER TABLE "uploaded_materials" RENAME COLUMN "notes" TO "content";

ALTER TABLE "uploaded_materials" ADD COLUMN "summary" varchar(500);
ALTER TABLE "uploaded_materials" ADD COLUMN "cover_url" varchar(500);

UPDATE "uploaded_materials"
SET
  "summary" = COALESCE("file_name", 'Cross-border operations material'),
  "content" = COALESCE(NULLIF("content", ''), 'This material was migrated from the previous upload metadata model. Update the body in the admin console before publishing.'),
  "status" = CASE
    WHEN "status" = 'reviewed' THEN 'published'
    WHEN "status" = 'needs_update' THEN 'archived'
    ELSE 'draft'
  END;

ALTER TABLE "uploaded_materials" ALTER COLUMN "summary" SET NOT NULL;
ALTER TABLE "uploaded_materials" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "uploaded_materials" ALTER COLUMN "file_name" DROP NOT NULL;
ALTER TABLE "uploaded_materials" ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "uploaded_materials" DROP CONSTRAINT IF EXISTS "uploaded_materials_inquiry_id_customer_inquiries_id_fk";
DROP INDEX IF EXISTS "uploaded_materials_inquiry_id_idx";
DROP INDEX IF EXISTS "uploaded_materials_contact_email_idx";

ALTER TABLE "uploaded_materials" DROP COLUMN "inquiry_id";
ALTER TABLE "uploaded_materials" DROP COLUMN "contact_email";

CREATE INDEX IF NOT EXISTS "uploaded_materials_category_idx" ON "uploaded_materials" USING btree ("category");
