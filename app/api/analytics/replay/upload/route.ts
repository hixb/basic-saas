import type { NextRequest } from 'next/server'
import { handleUploadAnalyticsReplayChunk } from '~/server/interfaces/http/analytics/analytics.handler'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  return handleUploadAnalyticsReplayChunk(request)
}
