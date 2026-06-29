import type { NextRequest } from 'next/server'
import { unauthorized } from '~/server/core/response/response.helper'
import { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'
import { JwtService } from '~/server/infrastructure/security/jwt.service'
import { getAdminSessionToken } from '../auth/session-cookie'

const jwtService = new JwtService()
const userRepository = new UserRepository()

/**
 * Validates admin request authentication from httpOnly session cookie.
 */
export async function requireAdmin(request: NextRequest) {
  const token = getAdminSessionToken(request)

  if (!token) {
    return {
      response: unauthorized('Authentication required'),
      user: null,
    }
  }

  try {
    const payload = jwtService.verify(token)
    const user = await userRepository.findById(payload.userId)

    if (!user || user.status !== 1) {
      return {
        response: unauthorized('Authentication required'),
        user: null,
      }
    }

    return {
      response: null,
      user,
    }
  }
  catch {
    return {
      response: unauthorized('Authentication required'),
      user: null,
    }
  }
}
