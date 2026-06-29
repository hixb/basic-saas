import { handleGetAnalyticsSettings } from '~/server/interfaces/http/analytics/analytics.handler'

export async function GET() {
  return handleGetAnalyticsSettings()
}
