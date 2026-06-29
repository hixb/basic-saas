import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleUploadMaterialFile } from '~/server/interfaces/http/admin/material-upload.handler'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleUploadMaterialFile(request)
}
