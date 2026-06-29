import { boolean, integer, jsonb, pgTable, serial, timestamp } from 'drizzle-orm/pg-core'

export type AnalyticsSetting = typeof analyticsSettings.$inferSelect
export type NewAnalyticsSetting = typeof analyticsSettings.$inferInsert

/**
 * Runtime analytics collection settings.
 */
export const analyticsSettings = pgTable('analytics_settings', {
  id: serial('id').primaryKey(),
  enabled: boolean('enabled').notNull().default(true),
  replayEnabled: boolean('replay_enabled').notNull().default(true),
  sampleRate: integer('sample_rate').notNull().default(100),
  replaySampleRate: integer('replay_sample_rate').notNull().default(100),
  retentionDays: integer('retention_days').notNull().default(0),
  blockedPaths: jsonb('blocked_paths').$type<string[]>().notNull().default(['/admin', '/admin/login']),
  maskTextSelectors: jsonb('mask_text_selectors').$type<string[]>().notNull().default(['[data-analytics-mask]']),
  blockSelectors: jsonb('block_selectors').$type<string[]>().notNull().default(['[data-analytics-block]']),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})
