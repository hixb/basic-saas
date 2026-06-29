import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleDeleteMaterial, handleGetAdminMaterialDetail, handleUpdateMaterial } from '~/server/interfaces/http/admin/material.handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { id } = await context.params
  return handleUpdateMaterial(request, Number(id))
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { id } = await context.params
  return handleGetAdminMaterialDetail(Number(id))
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  const { id } = await context.params
  return handleDeleteMaterial(Number(id))
}
