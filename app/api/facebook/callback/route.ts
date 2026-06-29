import type { NextRequest } from 'next/server'
import { handleFacebookCallback } from '~/server/interfaces/http/social/facebook-callback.handler'

export async function GET(request: NextRequest) {
  return handleFacebookCallback(request)
}
