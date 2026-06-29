import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type SensitiveWord = typeof sensitiveWords.$inferSelect
export type NewSensitiveWord = typeof sensitiveWords.$inferInsert

/**
 * Sensitive word status constants.
 */
export const SensitiveWordStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

/**
 * Sensitive words controlled by admins for customer-submitted descriptions.
 */
export const sensitiveWords = pgTable('sensitive_words', {
  id: serial('id').primaryKey(),
  word: varchar('word', { length: 120 }).notNull().unique(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  note: text('note'),
  status: integer('status').notNull().default(SensitiveWordStatus.ACTIVE),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('sensitive_words_status_idx').on(table.status),
  index('sensitive_words_word_idx').on(table.word),
]))
