import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { LoginUseCase } from '~/server/application/auth/login.usecase'
import { ADMIN_SESSION_COOKIE } from '~/server/core/auth/session-cookie'
import { badRequest, internalError, ok } from '~/server/core/response/response.helper'
import { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'
import { LoginLogRepository } from '~/server/infrastructure/logging/login-log.repository'
import { JwtService } from '~/server/infrastructure/security/jwt.service'
import { loginSchema } from '~/shared/schemas/auth.schema'

/**
 * Handle user login request
 */
export async function handleLogin(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return badRequest(validation.error.issues[0].message)
    }

    const userRepository = new UserRepository()
    const jwtService = new JwtService()
    const loginLogRepository = new LoginLogRepository()
    const loginUseCase = new LoginUseCase(userRepository, jwtService, loginLogRepository)

    const result = await loginUseCase.execute(validation.data)
    const response = ok({ user: result.user })

    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  }
  catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return internalError()
  }
}

/**
 * Handle user logout request.
 */
export async function handleLogout() {
  const response = NextResponse.json({ code: 0, message: 'Success', data: null })

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
