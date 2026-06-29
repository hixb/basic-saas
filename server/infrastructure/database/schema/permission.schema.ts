import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

/**
 * Permission type constants.
 */
export const PermissionType = {
  MENU: 1,
  BUTTON: 2,
  SETTINGS: 3,
} as const

/**
 * Permissions table for admin navigation and actions.
 */
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  type: integer('type').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  parentId: integer('parent_id').notNull().default(0),
  icon: varchar('icon', { length: 50 }).default(''),
  url: varchar('url', { length: 255 }).default(''),
  api: varchar('api', { length: 1000 }).default(''),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('permissions_parent_id_idx').on(table.parentId),
  index('permissions_sort_idx').on(table.sort),
]))
