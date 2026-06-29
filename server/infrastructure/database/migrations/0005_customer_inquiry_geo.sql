ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "ip" varchar(45);
ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "country_code" varchar(10);
ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "region" varchar(100);
ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "country" varchar(100);
ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "city" varchar(100);
ALTER TABLE "customer_inquiries" ADD COLUMN IF NOT EXISTS "emoji" varchar(10) DEFAULT '🏳️' NOT NULL;

CREATE INDEX IF NOT EXISTS "customer_inquiries_country_idx" ON "customer_inquiries" USING btree ("country");
