import type { NextRequest } from 'next/server'
import { handleGetPublicMaterialDetail } from '~/server/interfaces/http/admin/material.handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return handleGetPublicMaterialDetail(Number(id))
}
