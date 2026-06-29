import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

export type SocialPlatformConfig = typeof socialPlatformConfigs.$inferSelect
export type NewSocialPlatformConfig = typeof socialPlatformConfigs.$inferInsert

/**
 * Social platform configuration status values.
 */
export const SocialPlatformConfigStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

/**
 * Admin-managed social platform integration settings.
 */
export const socialPlatformConfigs = pgTable('social_platform_configs', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', { length: 30 }).notNull(),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  clientId: varchar('client_id', { length: 500 }).notNull(),
  clientSecret: varchar('client_secret', { length: 1000 }).notNull(),
  authUrl: varchar('auth_url', { length: 1000 }).notNull(),
  tokenUrl: varchar('token_url', { length: 1000 }).notNull(),
  apiBaseUrl: varchar('api_base_url', { length: 1000 }).notNull(),
  publishEndpoint: varchar('publish_endpoint', { length: 1000 }),
  uploadEndpoint: varchar('upload_endpoint', { length: 1000 }),
  scopes: text('scopes').notNull().default(''),
  status: integer('status').notNull().default(SocialPlatformConfigStatus.ACTIVE),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  uniqueIndex('social_platform_configs_platform_unique_idx').on(table.platform),
  index('social_platform_configs_status_idx').on(table.status),
]))
