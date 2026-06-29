import type { NextRequest } from 'next/server'
import { handleCreateAnalyticsSession } from '~/server/interfaces/http/analytics/analytics.handler'

export async function POST(request: NextRequest) {
  return handleCreateAnalyticsSession(request)
}
