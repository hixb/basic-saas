import { index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { analyticsSessions } from './analytics-session.schema'

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert

/**
 * Analytics events used for timelines, charts, and behavior search.
 */
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 80 }).notNull().references(() => analyticsSessions.sessionId, { onDelete: 'cascade' }),
  visitorId: varchar('visitor_id', { length: 80 }).notNull(),
  eventId: varchar('event_id', { length: 100 }).notNull(),
  type: varchar('type', { length: 60 }).notNull(),
  name: varchar('name', { length: 120 }),
  path: varchar('path', { length: 500 }),
  title: varchar('title', { length: 300 }),
  target: varchar('target', { length: 500 }),
  value: text('value'),
  durationMs: integer('duration_ms'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ([
  index('analytics_events_session_id_idx').on(table.sessionId),
  index('analytics_events_type_idx').on(table.type),
  index('analytics_events_path_idx').on(table.path),
  index('analytics_events_occurred_at_idx').on(table.occurredAt),
]))
