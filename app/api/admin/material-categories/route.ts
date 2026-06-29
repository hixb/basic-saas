import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleCreateMaterialCategory, handleGetMaterialCategories } from '~/server/interfaces/http/admin/material-category.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetMaterialCategories(request)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleCreateMaterialCategory(request)
}
