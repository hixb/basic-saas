import type { NextRequest } from 'next/server'

/**
 * Admin session cookie name.
 */
export const ADMIN_SESSION_COOKIE = 'admin_session'

/**
 * Reads admin session token from request cookies.
 */
export function getAdminSessionToken(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null
}
