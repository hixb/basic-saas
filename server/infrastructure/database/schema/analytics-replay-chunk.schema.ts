import { index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { analyticsSessions } from './analytics-session.schema'

export type AnalyticsReplayChunk = typeof analyticsReplayChunks.$inferSelect
export type NewAnalyticsReplayChunk = typeof analyticsReplayChunks.$inferInsert

/**
 * R2 object index for rrweb replay chunks.
 */
export const analyticsReplayChunks = pgTable('analytics_replay_chunks', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 80 }).notNull().references(() => analyticsSessions.sessionId, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  r2Key: varchar('r2_key', { length: 800 }).notNull(),
  contentType: varchar('content_type', { length: 120 }).notNull().default('application/json'),
  size: integer('size').notNull().default(0),
  eventCount: integer('event_count').notNull().default(0),
  checksum: varchar('checksum', { length: 100 }),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ([
  index('analytics_replay_chunks_session_id_idx').on(table.sessionId),
  uniqueIndex('analytics_replay_chunks_session_index_unique_idx').on(table.sessionId, table.chunkIndex),
]))
