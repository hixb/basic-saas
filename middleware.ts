import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from '~/lib/i18n/routing'
import { ADMIN_SESSION_COOKIE } from '~/server/core/auth/session-cookie'

const intlMiddleware = createMiddleware(routing)

function getLocalePrefix(pathname: string): string {
  const firstSegment = pathname.split('/')[1]
  return routing.locales.includes(firstSegment as any) ? `/${firstSegment}` : ''
}

function removeLocalePrefix(pathname: string, localePrefix: string): string {
  return localePrefix ? pathname.slice(localePrefix.length) || '/' : pathname
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const localePrefix = getLocalePrefix(pathname)
  const pathWithoutLocale = removeLocalePrefix(pathname, localePrefix)
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)

  if (pathWithoutLocale.startsWith('/admin') && pathWithoutLocale !== '/admin/login' && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/admin/login`
    return NextResponse.redirect(url)
  }

  if (pathWithoutLocale === '/admin/login' && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/admin/dashboard`
    return NextResponse.redirect(url)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
