import type { NextRequest } from 'next/server'
import { handleFinishAnalyticsSession } from '~/server/interfaces/http/analytics/analytics.handler'

export async function POST(request: NextRequest) {
  return handleFinishAnalyticsSession(request)
}
