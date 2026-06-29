import type { NextRequest } from 'next/server'
import { handleCommitAnalyticsReplayUpload } from '~/server/interfaces/http/analytics/analytics.handler'

export async function POST(request: NextRequest) {
  return handleCommitAnalyticsReplayUpload(request)
}
