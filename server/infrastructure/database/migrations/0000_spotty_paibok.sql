CREATE TABLE "customer_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_name" varchar(120) NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(60) NOT NULL,
	"password_hash" text NOT NULL,
	"description" text NOT NULL,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"sensitive_hit" boolean DEFAULT false NOT NULL,
	"matched_sensitive_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"username" varchar(255) NOT NULL,
	"status" integer NOT NULL,
	"failure_reason" varchar(255),
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" integer DEFAULT 0 NOT NULL,
	"icon" varchar(50) DEFAULT '',
	"url" varchar(255) DEFAULT '',
	"api" varchar(1000) DEFAULT '',
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"status" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sensitive_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" varchar(120) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"note" text,
	"status" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sensitive_words_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE TABLE "uploaded_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiry_id" integer,
	"contact_email" varchar(255) NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"material_type" varchar(80) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"file_url" varchar(500),
	"notes" text,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"nickname" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"avatar" varchar(255),
	"role_id" integer NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_materials" ADD CONSTRAINT "uploaded_materials_inquiry_id_customer_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."customer_inquiries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_inquiries_email_idx" ON "customer_inquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_inquiries_status_idx" ON "customer_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_inquiries_sensitive_hit_idx" ON "customer_inquiries" USING btree ("sensitive_hit");--> statement-breakpoint
CREATE INDEX "customer_inquiries_created_at_idx" ON "customer_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_logs_user_id_idx" ON "login_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_logs_username_idx" ON "login_logs" USING btree ("username");--> statement-breakpoint
CREATE INDEX "login_logs_status_idx" ON "login_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "login_logs_created_at_idx" ON "login_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "permissions_parent_id_idx" ON "permissions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "permissions_sort_idx" ON "permissions" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_unique_idx" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_status_idx" ON "roles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sensitive_words_status_idx" ON "sensitive_words" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sensitive_words_word_idx" ON "sensitive_words" USING btree ("word");--> statement-breakpoint
CREATE INDEX "uploaded_materials_inquiry_id_idx" ON "uploaded_materials" USING btree ("inquiry_id");--> statement-breakpoint
CREATE INDEX "uploaded_materials_contact_email_idx" ON "uploaded_materials" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "uploaded_materials_status_idx" ON "uploaded_materials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "uploaded_materials_created_at_idx" ON "uploaded_materials" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");