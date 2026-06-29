import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleGetAdminAnalyticsReplayUrls } from '~/server/interfaces/http/analytics/analytics.handler'

interface RouteContext {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { sessionId } = await context.params
  return handleGetAdminAnalyticsReplayUrls(sessionId)
}
