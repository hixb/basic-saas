import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: integer('status').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('roles_name_idx').on(table.name),
  index('roles_status_idx').on(table.status),
]))
