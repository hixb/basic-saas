import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export type LoginLog = typeof loginLogs.$inferSelect
export type NewLoginLog = typeof loginLogs.$inferInsert

/**
 * Login attempt status constants.
 */
export const LoginStatus = {
  SUCCESS: 1,
  FAILED: 2,
} as const

/**
 * Admin login attempt logs.
 */
export const loginLogs = pgTable('login_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  username: varchar('username', { length: 255 }).notNull(),
  status: integer('status').notNull(),
  failureReason: varchar('failure_reason', { length: 255 }),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ([
  index('login_logs_user_id_idx').on(table.userId),
  index('login_logs_username_idx').on(table.username),
  index('login_logs_status_idx').on(table.status),
  index('login_logs_created_at_idx').on(table.createdAt),
]))
