import type { NextRequest } from 'next/server'
import { handleLogin } from '~/server/interfaces/http/auth/login.handler'

export async function POST(request: NextRequest) {
  return handleLogin(request)
}
