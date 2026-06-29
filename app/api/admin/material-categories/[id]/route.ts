import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleDeleteMaterialCategory, handleUpdateMaterialCategory } from '~/server/interfaces/http/admin/material-category.handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { id } = await context.params
  return handleUpdateMaterialCategory(request, Number(id))
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { id } = await context.params
  return handleDeleteMaterialCategory(Number(id))
}
