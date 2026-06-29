import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type UploadedMaterial = typeof uploadedMaterials.$inferSelect
export type NewUploadedMaterial = typeof uploadedMaterials.$inferInsert

/**
 * Material review status constants.
 */
export const UploadedMaterialStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

/**
 * Admin-managed content materials displayed on the public site.
 */
export const uploadedMaterials = pgTable('uploaded_materials', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 180 }).notNull(),
  summary: varchar('summary', { length: 500 }).notNull(),
  category: varchar('category', { length: 80 }).notNull(),
  content: text('content').notNull(),
  coverKey: varchar('cover_key', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size').notNull().default(0),
  fileKey: varchar('file_key', { length: 500 }),
  fileContentType: varchar('file_content_type', { length: 120 }),
  status: varchar('status', { length: 30 }).notNull().default(UploadedMaterialStatus.DRAFT),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('uploaded_materials_category_idx').on(table.category),
  index('uploaded_materials_status_idx').on(table.status),
  index('uploaded_materials_created_at_idx').on(table.createdAt),
]))
