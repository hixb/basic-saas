ALTER TABLE "uploaded_materials" RENAME COLUMN "cover_url" TO "cover_key";
ALTER TABLE "uploaded_materials" RENAME COLUMN "file_url" TO "file_key";
ALTER TABLE "uploaded_materials" ADD COLUMN IF NOT EXISTS "file_content_type" varchar(120);
