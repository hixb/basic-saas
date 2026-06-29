import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleCreateSocialPlatformConfig, handleGetSocialPlatformConfigs } from '~/server/interfaces/http/admin/social-platform-config.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetSocialPlatformConfigs(request)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleCreateSocialPlatformConfig(request)
}
