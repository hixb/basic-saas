import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectFacebookFromCallback } from '~/server/application/social/connect-facebook.usecase'
import { requireAdmin } from '~/server/core/guards/admin-auth.guard'
import { badRequest, fail } from '~/server/core/response/response.helper'
import { ResponseCode } from '~/shared/types/api.type'

function buildAdminRedirect(request: NextRequest, params: Record<string, string>) {
  const url = new URL('/admin/social-platforms', request.nextUrl.origin)

  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)

  return NextResponse.redirect(url)
}

/**
 * Handles Facebook OAuth callback requests.
 */
export async function handleFacebookCallback(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.response)
    return auth.response

  const error = request.nextUrl.searchParams.get('error')
  const errorDescription = request.nextUrl.searchParams.get('error_description')

  if (error) {
    return badRequest(errorDescription ?? error)
  }

  const code = request.nextUrl.searchParams.get('code')

  if (!code)
    return badRequest('Facebook authorization code is required')

  try {
    await connectFacebookFromCallback({
      userId: auth.user.id,
      code,
    })

    return buildAdminRedirect(request, { facebook: 'connected' })
  }
  catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : 'Facebook callback failed'
    return fail(ResponseCode.EXTERNAL_SERVICE_ERROR, message)
  }
}
