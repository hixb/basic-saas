import type { NewAnalyticsEvent } from '~/server/infrastructure/database/schema/analytics-event.schema'
import type { NewAnalyticsReplayChunk } from '~/server/infrastructure/database/schema/analytics-replay-chunk.schema'
import type { AnalyticsSession, NewAnalyticsSession } from '~/server/infrastructure/database/schema/analytics-session.schema'
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { analyticsEvents } from '~/server/infrastructure/database/schema/analytics-event.schema'
import { analyticsReplayChunks } from '~/server/infrastructure/database/schema/analytics-replay-chunk.schema'
import { analyticsSessions } from '~/server/infrastructure/database/schema/analytics-session.schema'
import { analyticsSettings } from '~/server/infrastructure/database/schema/analytics-setting.schema'

export interface AnalyticsSessionListParams {
  page: number
  pageSize: number
  keyword?: string
  country?: string
  hasReplay?: boolean
  from?: Date
  to?: Date
  sortDirection?: 'ascending' | 'descending'
}

export interface AnalyticsOverview {
  metrics: {
    sessions: number
    events: number
    replaySessions: number
    countries: number
  }
  sessionTrend: Array<{ date: string, sessions: number, events: number }>
  topCountries: Array<{ country: string, value: number }>
  topPages: Array<{ path: string, value: number }>
}

function normalizeSettings(settings: typeof analyticsSettings.$inferSelect) {
  return {
    ...settings,
    blockedPaths: Array.from(new Set(['/admin', '/admin/login', ...settings.blockedPaths])),
  }
}

function compactWhere(parts: Array<ReturnType<typeof eq> | undefined>) {
  const active = parts.filter(Boolean)
  return active.length ? and(...active) : undefined
}

/**
 * Repository for analytics sessions, events, replay chunks, and settings.
 */
export class AnalyticsRepository {
  /**
   * Return collection settings, creating defaults when missing.
   */
  async getSettings() {
    const existing = await db.select().from(analyticsSettings).where(eq(analyticsSettings.id, 1)).limit(1)

    if (existing[0])
      return normalizeSettings(existing[0])

    const created = await db.insert(analyticsSettings).values({ id: 1 }).returning()
    return normalizeSettings(created[0])
  }

  /**
   * Create or update an analytics session.
   */
  async upsertSession(data: NewAnalyticsSession): Promise<AnalyticsSession> {
    const result = await db
      .insert(analyticsSessions)
      .values(data)
      .onConflictDoUpdate({
        target: analyticsSessions.sessionId,
        set: {
          exitPath: data.exitPath,
          userAgent: data.userAgent,
          deviceType: data.deviceType,
          browser: data.browser,
          os: data.os,
          language: data.language,
          screen: data.screen,
          timezone: data.timezone,
          ip: data.ip,
          countryCode: data.countryCode,
          region: data.region,
          country: data.country,
          city: data.city,
          emoji: data.emoji,
          metadata: data.metadata,
          replayEnabled: data.replayEnabled,
          isFinished: false,
          updatedAt: new Date(),
        },
      })
      .returning()

    return result[0]
  }

  /**
   * Insert analytics events and update session counters.
   */
  async createEvents(events: NewAnalyticsEvent[]) {
    if (!events.length)
      return

    await db.insert(analyticsEvents).values(events)

    const grouped = new Map<string, { count: number, first: Date, last: Date, exitPath: string | null }>()
    for (const event of events) {
      const existing = grouped.get(event.sessionId)
      const occurredAt = event.occurredAt instanceof Date ? event.occurredAt : new Date(event.occurredAt)
      const nextPath = event.path ?? null

      if (!existing) {
        grouped.set(event.sessionId, {
          count: 1,
          first: occurredAt,
          last: occurredAt,
          exitPath: nextPath,
        })
        continue
      }

      existing.count += 1
      existing.first = occurredAt < existing.first ? occurredAt : existing.first
      existing.last = occurredAt > existing.last ? occurredAt : existing.last
      existing.exitPath = nextPath ?? existing.exitPath
    }

    await Promise.all(Array.from(grouped.entries()).map(([sessionId, item]) => {
      const lastOccurredAt = item.last.toISOString()

      return db
        .update(analyticsSessions)
        .set({
          eventCount: sql`${analyticsSessions.eventCount} + ${item.count}`,
          firstEventAt: item.first,
          lastEventAt: item.last,
          durationMs: sql`greatest(${analyticsSessions.durationMs}, floor(extract(epoch from (${lastOccurredAt}::timestamptz - ${analyticsSessions.createdAt})) * 1000)::int)`,
          exitPath: item.exitPath,
          updatedAt: new Date(),
        })
        .where(eq(analyticsSessions.sessionId, sessionId))
    }))
  }

  /**
   * Create replay chunk metadata and update session replay counters.
   */
  async createReplayChunk(data: NewAnalyticsReplayChunk) {
    const result = await db
      .insert(analyticsReplayChunks)
      .values(data)
      .onConflictDoUpdate({
        target: [analyticsReplayChunks.sessionId, analyticsReplayChunks.chunkIndex],
        set: {
          r2Key: data.r2Key,
          contentType: data.contentType,
          size: data.size,
          eventCount: data.eventCount,
          checksum: data.checksum,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      })
      .returning()

    const replayStats = await db
      .select({
        chunkCount: count(),
        totalSize: sql<number>`coalesce(sum(${analyticsReplayChunks.size}), 0)::int`,
      })
      .from(analyticsReplayChunks)
      .where(eq(analyticsReplayChunks.sessionId, data.sessionId))

    await db
      .update(analyticsSessions)
      .set({
        hasReplay: true,
        replayChunkCount: replayStats[0]?.chunkCount ?? 0,
        replaySize: replayStats[0]?.totalSize ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(analyticsSessions.sessionId, data.sessionId))

    return result[0]
  }

  /**
   * Mark a session as finished.
   */
  async finishSession(sessionId: string, durationMs: number, exitPath?: string | null) {
    await db
      .update(analyticsSessions)
      .set({
        durationMs: sql`greatest(${analyticsSessions.durationMs}, ${durationMs})`,
        exitPath,
        isFinished: true,
        updatedAt: new Date(),
      })
      .where(eq(analyticsSessions.sessionId, sessionId))
  }

  /**
   * Find sessions with pagination.
   */
  async findSessions(params: AnalyticsSessionListParams): Promise<{ data: AnalyticsSession[], total: number }> {
    const where = compactWhere([
      params.keyword
        ? or(
            ilike(analyticsSessions.sessionId, `%${params.keyword}%`),
            ilike(analyticsSessions.visitorId, `%${params.keyword}%`),
            ilike(analyticsSessions.entryPath, `%${params.keyword}%`),
            ilike(analyticsSessions.city, `%${params.keyword}%`),
            ilike(analyticsSessions.country, `%${params.keyword}%`),
            ilike(analyticsSessions.ip, `%${params.keyword}%`),
          )
        : undefined,
      params.country ? eq(analyticsSessions.country, params.country) : undefined,
      typeof params.hasReplay === 'boolean' ? eq(analyticsSessions.hasReplay, params.hasReplay) : undefined,
      params.from ? gte(analyticsSessions.createdAt, params.from) : undefined,
      params.to ? lte(analyticsSessions.createdAt, params.to) : undefined,
    ])

    const orderBy = params.sortDirection === 'ascending'
      ? asc(analyticsSessions.createdAt)
      : desc(analyticsSessions.createdAt)

    const data = await db
      .select()
      .from(analyticsSessions)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db
      .select({ value: count() })
      .from(analyticsSessions)
      .where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Find a session by public session ID.
   */
  async findSessionBySessionId(sessionId: string) {
    const result = await db.select().from(analyticsSessions).where(eq(analyticsSessions.sessionId, sessionId)).limit(1)
    return result[0] ?? null
  }

  /**
   * Find timeline events for a session.
   */
  async findEventsBySessionId(sessionId: string) {
    return db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.sessionId, sessionId))
      .orderBy(asc(analyticsEvents.occurredAt))
  }

  /**
   * Find replay chunks for a session.
   */
  async findReplayChunksBySessionId(sessionId: string) {
    return db
      .select()
      .from(analyticsReplayChunks)
      .where(eq(analyticsReplayChunks.sessionId, sessionId))
      .orderBy(asc(analyticsReplayChunks.chunkIndex))
  }

  /**
   * Delete a session and return its R2 keys.
   */
  async deleteSession(sessionId: string) {
    const chunks = await this.findReplayChunksBySessionId(sessionId)

    await db
      .delete(analyticsSessions)
      .where(eq(analyticsSessions.sessionId, sessionId))

    return chunks.map(chunk => chunk.r2Key)
  }

  /**
   * Return dashboard metrics for admin analytics.
   */
  async getOverview(): Promise<AnalyticsOverview> {
    const [sessionCount, eventCount, replayCount, countryCount, trend, topCountries, topPages] = await Promise.all([
      db.select({ value: count() }).from(analyticsSessions),
      db.select({ value: count() }).from(analyticsEvents),
      db.select({ value: count() }).from(analyticsSessions).where(eq(analyticsSessions.hasReplay, true)),
      db.select({ value: sql<number>`count(distinct ${analyticsSessions.country})::int` }).from(analyticsSessions),
      db
        .select({
          date: sql<string>`to_char(date_trunc('day', ${analyticsSessions.createdAt}), 'YYYY-MM-DD')`,
          sessions: count(analyticsSessions.id),
          events: sql<number>`coalesce(sum(${analyticsSessions.eventCount}), 0)::int`,
        })
        .from(analyticsSessions)
        .where(gte(analyticsSessions.createdAt, sql`now() - interval '14 days'`))
        .groupBy(sql`date_trunc('day', ${analyticsSessions.createdAt})`)
        .orderBy(sql`date_trunc('day', ${analyticsSessions.createdAt})`),
      db
        .select({
          country: sql<string>`coalesce(${analyticsSessions.country}, 'Unknown')`,
          value: count(),
        })
        .from(analyticsSessions)
        .groupBy(sql`coalesce(${analyticsSessions.country}, 'Unknown')`)
        .orderBy(desc(count()))
        .limit(8),
      db
        .select({
          path: sql<string>`coalesce(${analyticsEvents.path}, 'Unknown')`,
          value: count(),
        })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.type, 'pageview'))
        .groupBy(sql`coalesce(${analyticsEvents.path}, 'Unknown')`)
        .orderBy(desc(count()))
        .limit(8),
    ])

    return {
      metrics: {
        sessions: sessionCount[0]?.value ?? 0,
        events: eventCount[0]?.value ?? 0,
        replaySessions: replayCount[0]?.value ?? 0,
        countries: countryCount[0]?.value ?? 0,
      },
      sessionTrend: trend,
      topCountries,
      topPages,
    }
  }
}
