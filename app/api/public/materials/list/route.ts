import type { NextRequest } from 'next/server'
import { handleGetPublicMaterials } from '~/server/interfaces/http/admin/material.handler'

export async function GET(request: NextRequest) {
  return handleGetPublicMaterials(request)
}
