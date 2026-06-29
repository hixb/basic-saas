import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { roles } from './role.schema'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  nickname: varchar('nickname', { length: 100 }).notNull(),
  password: text('password').notNull(),
  avatar: varchar('avatar', { length: 255 }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  status: integer('status').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('users_role_id_idx').on(table.roleId),
  index('users_status_idx').on(table.status),
  index('users_email_idx').on(table.email),
]))
