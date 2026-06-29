import type { NextRequest } from 'next/server'
import { handleCreateAnalyticsEvents } from '~/server/interfaces/http/analytics/analytics.handler'

export async function POST(request: NextRequest) {
  return handleCreateAnalyticsEvents(request)
}
