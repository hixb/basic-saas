import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleGetAdminUsers } from '~/server/interfaces/http/admin/user.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetAdminUsers(request)
}
