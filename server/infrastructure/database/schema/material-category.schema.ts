import { index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

export type MaterialCategory = typeof materialCategories.$inferSelect
export type NewMaterialCategory = typeof materialCategories.$inferInsert

export const MaterialCategoryStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

/**
 * Admin-managed categories for public content materials.
 */
export const materialCategories = pgTable('material_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull(),
  description: varchar('description', { length: 500 }),
  status: integer('status').notNull().default(MaterialCategoryStatus.ACTIVE),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  uniqueIndex('material_categories_slug_unique_idx').on(table.slug),
  index('material_categories_status_idx').on(table.status),
  index('material_categories_created_at_idx').on(table.createdAt),
]))
