import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleGetAdminAnalyticsOverview } from '~/server/interfaces/http/analytics/analytics.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetAdminAnalyticsOverview()
}
