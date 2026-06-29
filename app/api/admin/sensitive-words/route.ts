import type { NextRequest } from 'next/server'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { handleCreateSensitiveWord, handleGetSensitiveWords } from '~/server/interfaces/http/admin/sensitive-word.handler'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleGetSensitiveWords(request)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.response)
    return auth.response

  return handleCreateSensitiveWord(request)
}
