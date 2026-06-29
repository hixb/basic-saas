import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleCreateMaterial, handleGetAdminMaterials } from '~/server/interfaces/http/admin/material.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetAdminMaterials(request)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleCreateMaterial(request)
}
