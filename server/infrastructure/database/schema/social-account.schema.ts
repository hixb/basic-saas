import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export type SocialAccount = typeof socialAccounts.$inferSelect
export type NewSocialAccount = typeof socialAccounts.$inferInsert

/**
 * Supported social publishing platform values.
 */
export const SocialPlatform = {
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
} as const

export type SocialPlatformType = (typeof SocialPlatform)[keyof typeof SocialPlatform]

/**
 * OAuth account credentials connected by admin users.
 */
export const socialAccounts = pgTable('social_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 30 }).notNull(),
  platformAccountId: varchar('platform_account_id', { length: 255 }),
  accessToken: varchar('access_token', { length: 4000 }).notNull(),
  refreshToken: varchar('refresh_token', { length: 4000 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('social_accounts_user_id_idx').on(table.userId),
  index('social_accounts_platform_idx').on(table.platform),
]))
