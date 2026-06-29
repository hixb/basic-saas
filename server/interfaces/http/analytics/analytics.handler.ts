import type { NextRequest } from 'next/server'
import { badRequest, calculatePagination, created, deleted, fail, notFound, ok, paginated } from '~/server/core/response/response.helper'
import { AnalyticsRepository } from '~/server/infrastructure/database/repositories/analytics.repository'
import { fetchGeoByIp, getClientIp } from '~/server/infrastructure/geo/ip-geo.service'
import { R2StorageService } from '~/server/infrastructure/storage/r2.service'
import {
  analyticsEventsBatchSchema,
  analyticsFinishSessionSchema,
  analyticsReplayCommitSchema,
  analyticsReplaySignSchema,
  analyticsReplayUploadSchema,
  analyticsSessionSchema,
} from '~/shared/schemas/analytics.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const analyticsRepository = new AnalyticsRepository()
const storage = new R2StorageService()
const RRWEB_EVENT_TYPE_META = 4
const RRWEB_EVENT_TYPE_FULL_SNAPSHOT = 2

interface ReplayEventLike {
  type?: unknown
  timestamp?: unknown
  data?: unknown
}

interface NormalizedReplayEvent extends ReplayEventLike {
  timestamp: number
}

interface ReplayChunkReadResult {
  events: unknown[]
  error?: {
    chunkIndex: number
    message: string
  }
}

function parseOptionalDate(value: string | null) {
  if (!value)
    return undefined

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function shouldCollect(sampleRate: number) {
  return Math.random() * 100 < sampleRate
}

function isReplayEvent(value: unknown): value is NormalizedReplayEvent {
  return typeof value === 'object'
    && value !== null
    && 'type' in value
    && 'timestamp' in value
    && typeof (value as ReplayEventLike).timestamp === 'number'
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function buildReplayDiagnostics(events: ReplayEventLike[], chunks: number, failedChunks: ReplayChunkReadResult['error'][]) {
  const typeCounts = events.reduce<Record<string, number>>((acc, event) => {
    const type = String(event.type)
    acc[type] = (acc[type] ?? 0) + 1
    return acc
  }, {})
  const meta = events.find(event => event.type === RRWEB_EVENT_TYPE_META)
  const fullSnapshot = events.find(event => event.type === RRWEB_EVENT_TYPE_FULL_SNAPSHOT)
  const first = events[0]
  const last = events.at(-1)

  return {
    chunks,
    failedChunks,
    failedChunkCount: failedChunks.length,
    eventCount: events.length,
    typeCounts,
    hasMeta: Boolean(meta),
    hasFullSnapshot: Boolean(fullSnapshot),
    firstTimestamp: typeof first?.timestamp === 'number' ? first.timestamp : null,
    lastTimestamp: typeof last?.timestamp === 'number' ? last.timestamp : null,
    firstTypes: events.slice(0, 8).map(event => event.type),
    meta: meta?.data ?? null,
    fullSnapshotNodeType: typeof fullSnapshot?.data === 'object' && fullSnapshot.data !== null && 'node' in fullSnapshot.data
      ? (fullSnapshot.data as { node?: { type?: unknown } }).node?.type ?? null
      : null,
  }
}

async function readReplayChunk(chunk: { chunkIndex: number, r2Key: string }): Promise<ReplayChunkReadResult> {
  try {
    const text = await storage.getObjectText(chunk.r2Key)
    const parsed = JSON.parse(text) as unknown

    return {
      events: Array.isArray(parsed) ? parsed : [],
    }
  }
  catch (error) {
    return {
      events: [],
      error: {
        chunkIndex: chunk.chunkIndex,
        message: getErrorMessage(error),
      },
    }
  }
}

/**
 * Return analytics collection settings for the browser SDK.
 */
export async function handleGetAnalyticsSettings() {
  const settings = await analyticsRepository.getSettings()
  const enabled = settings.enabled && shouldCollect(settings.sampleRate)
  const replayEnabled = enabled && settings.replayEnabled && shouldCollect(settings.replaySampleRate)

  return ok({
    enabled,
    replayEnabled,
    blockedPaths: settings.blockedPaths,
    maskTextSelectors: settings.maskTextSelectors,
    blockSelectors: settings.blockSelectors,
  })
}

/**
 * Create or refresh an analytics session.
 */
export async function handleCreateAnalyticsSession(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsSessionSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  const settings = await analyticsRepository.getSettings()
  const ip = getClientIp(request)
  const geo = await fetchGeoByIp(ip)

  const session = await analyticsRepository.upsertSession({
    sessionId: validation.data.sessionId,
    visitorId: validation.data.visitorId,
    userId: validation.data.userId ?? null,
    entryPath: validation.data.entryPath,
    exitPath: validation.data.exitPath ?? null,
    referrer: validation.data.referrer ?? null,
    userAgent: validation.data.userAgent ?? request.headers.get('user-agent'),
    deviceType: validation.data.deviceType ?? null,
    browser: validation.data.browser ?? null,
    os: validation.data.os ?? null,
    language: validation.data.language ?? null,
    screen: validation.data.screen ?? null,
    timezone: validation.data.timezone ?? null,
    ip: geo?.ip ?? ip,
    countryCode: geo?.countryCode ?? null,
    region: geo?.region ?? null,
    country: geo?.country ?? null,
    city: geo?.city ?? null,
    emoji: geo?.emoji ?? '',
    replayEnabled: settings.enabled && settings.replayEnabled,
    metadata: validation.data.metadata ?? {},
  })

  return created({
    sessionId: session.sessionId,
    enabled: settings.enabled,
    replayEnabled: session.replayEnabled,
  })
}

/**
 * Store analytics event batch.
 */
export async function handleCreateAnalyticsEvents(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsEventsBatchSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  const session = await analyticsRepository.findSessionBySessionId(validation.data.sessionId)

  if (!session)
    return notFound('Analytics session not found')

  await analyticsRepository.createEvents(validation.data.events.map(event => ({
    sessionId: validation.data.sessionId,
    visitorId: validation.data.visitorId,
    eventId: event.eventId,
    type: event.type,
    name: event.name ?? null,
    path: event.path ?? null,
    title: event.title ?? null,
    target: event.target ?? null,
    value: event.value ?? null,
    durationMs: event.durationMs ?? null,
    occurredAt: new Date(event.occurredAt),
    payload: event.payload ?? {},
  })))

  return ok({ accepted: validation.data.events.length })
}

/**
 * Generate an R2 signed URL for a replay chunk upload.
 */
export async function handleSignAnalyticsReplayUpload(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsReplaySignSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  const session = await analyticsRepository.findSessionBySessionId(validation.data.sessionId)

  if (!session)
    return notFound('Analytics session not found')

  if (!session.replayEnabled)
    return badRequest('Replay collection is disabled for this session')

  const key = storage.createAnalyticsReplayKey({
    sessionId: validation.data.sessionId,
    chunkIndex: validation.data.chunkIndex,
    compressed: validation.data.compressed,
  })
  const signed = storage.createPresignedPutUrl(key, validation.data.contentType)

  return ok(signed)
}

/**
 * Commit uploaded replay chunk metadata after R2 upload succeeds.
 */
export async function handleCommitAnalyticsReplayUpload(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsReplayCommitSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  const session = await analyticsRepository.findSessionBySessionId(validation.data.sessionId)

  if (!session)
    return notFound('Analytics session not found')

  const chunk = await analyticsRepository.createReplayChunk({
    sessionId: validation.data.sessionId,
    chunkIndex: validation.data.chunkIndex,
    r2Key: validation.data.key,
    contentType: validation.data.contentType,
    size: validation.data.size,
    eventCount: validation.data.eventCount,
    checksum: validation.data.checksum ?? null,
    startTime: validation.data.startTime ? new Date(validation.data.startTime) : null,
    endTime: validation.data.endTime ? new Date(validation.data.endTime) : null,
  })

  return created({ id: chunk.id, key: chunk.r2Key })
}

/**
 * Upload replay chunk through the application server to avoid browser R2 CORS.
 */
export async function handleUploadAnalyticsReplayChunk(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsReplayUploadSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  const session = await analyticsRepository.findSessionBySessionId(validation.data.sessionId)

  if (!session)
    return notFound('Analytics session not found')

  if (!session.replayEnabled)
    return badRequest('Replay collection is disabled for this session')

  const uploaded = await storage.uploadAnalyticsReplayChunk({
    sessionId: validation.data.sessionId,
    chunkIndex: validation.data.chunkIndex,
    payload: validation.data.payload,
    contentType: validation.data.contentType,
  })

  const chunk = await analyticsRepository.createReplayChunk({
    sessionId: validation.data.sessionId,
    chunkIndex: validation.data.chunkIndex,
    r2Key: uploaded.key,
    contentType: uploaded.contentType,
    size: uploaded.size,
    eventCount: validation.data.eventCount,
    checksum: validation.data.checksum ?? null,
    startTime: validation.data.startTime ? new Date(validation.data.startTime) : null,
    endTime: validation.data.endTime ? new Date(validation.data.endTime) : null,
  })

  return created({ id: chunk.id, key: chunk.r2Key, size: uploaded.size })
}

/**
 * Mark a session as finished.
 */
export async function handleFinishAnalyticsSession(request: NextRequest) {
  const body = await request.json()
  const validation = analyticsFinishSessionSchema.safeParse(body)

  if (!validation.success)
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))

  await analyticsRepository.finishSession(
    validation.data.sessionId,
    validation.data.durationMs,
    validation.data.exitPath ?? null,
  )

  return ok({ finished: true })
}

/**
 * Return analytics overview metrics for admin.
 */
export async function handleGetAdminAnalyticsOverview() {
  return ok(await analyticsRepository.getOverview())
}

/**
 * Return paginated analytics sessions for admin.
 */
export async function handleGetAdminAnalyticsSessions(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const country = searchParams.get('country') ?? undefined
  const hasReplay = searchParams.get('hasReplay')
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'

  const result = await analyticsRepository.findSessions({
    page,
    pageSize,
    keyword,
    country,
    hasReplay: hasReplay == null || hasReplay === '' ? undefined : hasReplay === 'true',
    from: parseOptionalDate(searchParams.get('from')),
    to: parseOptionalDate(searchParams.get('to')),
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Return a session with event timeline and replay chunk metadata.
 */
export async function handleGetAdminAnalyticsSessionDetail(sessionId: string) {
  const session = await analyticsRepository.findSessionBySessionId(sessionId)

  if (!session)
    return notFound('Analytics session not found')

  const [events, chunks] = await Promise.all([
    analyticsRepository.findEventsBySessionId(sessionId),
    analyticsRepository.findReplayChunksBySessionId(sessionId),
  ])

  return ok({ session, events, chunks })
}

/**
 * Return short-lived private R2 URLs for replay chunks.
 */
export async function handleGetAdminAnalyticsReplayUrls(sessionId: string) {
  const session = await analyticsRepository.findSessionBySessionId(sessionId)

  if (!session)
    return notFound('Analytics session not found')

  const chunks = await analyticsRepository.findReplayChunksBySessionId(sessionId)

  return ok({
    sessionId,
    urls: chunks.map(chunk => ({
      chunkIndex: chunk.chunkIndex,
      contentType: chunk.contentType,
      eventCount: chunk.eventCount,
      size: chunk.size,
      ...storage.createPresignedGetUrl(chunk.r2Key),
    })),
  })
}

/**
 * Return merged replay events through the application server to avoid browser R2 CORS.
 */
export async function handleGetAdminAnalyticsReplayEvents(sessionId: string) {
  const session = await analyticsRepository.findSessionBySessionId(sessionId)

  if (!session)
    return notFound('Analytics session not found')

  const chunks = await analyticsRepository.findReplayChunksBySessionId(sessionId)
  const payloads = await Promise.all(chunks.map(readReplayChunk))
  const failedChunks = payloads.map(payload => payload.error).filter(error => error != null)

  const events = payloads
    .flatMap(payload => payload.events)
    .filter(isReplayEvent)
    .sort((a, b) => a.timestamp - b.timestamp)

  return ok({
    sessionId,
    events,
    chunks: chunks.length,
    diagnostics: buildReplayDiagnostics(events, chunks.length, failedChunks),
  })
}

/**
 * Delete a session, database records, and persisted R2 replay objects.
 */
export async function handleDeleteAdminAnalyticsSession(sessionId: string) {
  const keys = await analyticsRepository.deleteSession(sessionId)
  await storage.deleteObjects(keys)
  return deleted()
}
