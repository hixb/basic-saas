import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type AnalyticsSession = typeof analyticsSessions.$inferSelect
export type NewAnalyticsSession = typeof analyticsSessions.$inferInsert

/**
 * Analytics visitor sessions enriched with replay and geo metadata.
 */
export const analyticsSessions = pgTable('analytics_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 80 }).notNull().unique(),
  visitorId: varchar('visitor_id', { length: 80 }).notNull(),
  userId: varchar('user_id', { length: 120 }),
  entryPath: varchar('entry_path', { length: 500 }).notNull(),
  exitPath: varchar('exit_path', { length: 500 }),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 40 }),
  browser: varchar('browser', { length: 80 }),
  os: varchar('os', { length: 80 }),
  language: varchar('language', { length: 80 }),
  screen: varchar('screen', { length: 40 }),
  timezone: varchar('timezone', { length: 80 }),
  ip: varchar('ip', { length: 45 }),
  countryCode: varchar('country_code', { length: 10 }),
  region: varchar('region', { length: 100 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  emoji: varchar('emoji', { length: 10 }).notNull().default(''),
  eventCount: integer('event_count').notNull().default(0),
  replayChunkCount: integer('replay_chunk_count').notNull().default(0),
  replaySize: integer('replay_size').notNull().default(0),
  replayEnabled: boolean('replay_enabled').notNull().default(true),
  hasReplay: boolean('has_replay').notNull().default(false),
  isFinished: boolean('is_finished').notNull().default(false),
  durationMs: integer('duration_ms').notNull().default(0),
  firstEventAt: timestamp('first_event_at', { withTimezone: true }),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('analytics_sessions_visitor_id_idx').on(table.visitorId),
  index('analytics_sessions_created_at_idx').on(table.createdAt),
  index('analytics_sessions_country_idx').on(table.country),
  index('analytics_sessions_city_idx').on(table.city),
  index('analytics_sessions_has_replay_idx').on(table.hasReplay),
]))
