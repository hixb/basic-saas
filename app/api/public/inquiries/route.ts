import type { NextRequest } from 'next/server'
import { handleCreateInquiry } from '~/server/interfaces/http/admin/inquiry.handler'

export async function POST(request: NextRequest) {
  return handleCreateInquiry(request)
}
