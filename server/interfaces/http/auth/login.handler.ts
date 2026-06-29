import type { NextRequest } from 'next/server'
import { LoginUseCase } from '~/server/application/auth/login.usecase'
import { badRequest, internalError, ok } from '~/server/core/response/response.helper'
import { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'
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
    const loginUseCase = new LoginUseCase(userRepository, jwtService)

    const result = await loginUseCase.execute(validation.data)

    return ok(result)
  }
  catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return internalError()
  }
}
