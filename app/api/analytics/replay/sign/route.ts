import type { NextRequest } from 'next/server'
import { handleSignAnalyticsReplayUpload } from '~/server/interfaces/http/analytics/analytics.handler'

export async function POST(request: NextRequest) {
  return handleSignAnalyticsReplayUpload(request)
}
