import { z } from 'zod'

const metadataSchema = z.record(z.string(), z.unknown()).default({})

export const analyticsSessionSchema = z.object({
  sessionId: z.string().min(8).max(80),
  visitorId: z.string().min(8).max(80),
  userId: z.string().max(120).optional().nullable(),
  entryPath: z.string().min(1).max(500),
  exitPath: z.string().max(500).optional().nullable(),
  referrer: z.string().max(2000).optional().nullable(),
  userAgent: z.string().max(2000).optional().nullable(),
  deviceType: z.string().max(40).optional().nullable(),
  browser: z.string().max(80).optional().nullable(),
  os: z.string().max(80).optional().nullable(),
  language: z.string().max(80).optional().nullable(),
  screen: z.string().max(40).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  metadata: metadataSchema.optional(),
})

export const analyticsEventSchema = z.object({
  eventId: z.string().min(8).max(100),
  type: z.string().min(1).max(60),
  name: z.string().max(120).optional().nullable(),
  path: z.string().max(500).optional().nullable(),
  title: z.string().max(300).optional().nullable(),
  target: z.string().max(500).optional().nullable(),
  value: z.string().max(2000).optional().nullable(),
  durationMs: z.number().int().min(0).max(86_400_000).optional().nullable(),
  occurredAt: z.string().datetime(),
  payload: metadataSchema.optional(),
})

export const analyticsEventsBatchSchema = z.object({
  sessionId: z.string().min(8).max(80),
  visitorId: z.string().min(8).max(80),
  events: z.array(analyticsEventSchema).min(1).max(100),
})

export const analyticsReplaySignSchema = z.object({
  sessionId: z.string().min(8).max(80),
  chunkIndex: z.number().int().min(0).max(10000),
  contentType: z.string().max(120).default('application/json'),
  compressed: z.boolean().default(false),
})

export const analyticsReplayCommitSchema = z.object({
  sessionId: z.string().min(8).max(80),
  chunkIndex: z.number().int().min(0).max(10000),
  key: z.string().min(1).max(800),
  contentType: z.string().max(120).default('application/json'),
  size: z.number().int().min(0).max(50_000_000),
  eventCount: z.number().int().min(0).max(100000),
  checksum: z.string().max(100).optional().nullable(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
})

export const analyticsReplayUploadSchema = z.object({
  sessionId: z.string().min(8).max(80),
  chunkIndex: z.number().int().min(0).max(10000),
  contentType: z.string().max(120).default('application/json'),
  payload: z.string().min(2).max(50_000_000),
  eventCount: z.number().int().min(0).max(100000),
  checksum: z.string().max(100).optional().nullable(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
})

export const analyticsFinishSessionSchema = z.object({
  sessionId: z.string().min(8).max(80),
  durationMs: z.number().int().min(0).max(86_400_000),
  exitPath: z.string().max(500).optional().nullable(),
})

export type AnalyticsSessionInput = z.infer<typeof analyticsSessionSchema>
export type AnalyticsEventsBatchInput = z.infer<typeof analyticsEventsBatchSchema>
export type AnalyticsReplaySignInput = z.infer<typeof analyticsReplaySignSchema>
export type AnalyticsReplayCommitInput = z.infer<typeof analyticsReplayCommitSchema>
export type AnalyticsReplayUploadInput = z.infer<typeof analyticsReplayUploadSchema>
