import jwt from 'jsonwebtoken'
import { env } from '~/config/env'

const JWT_EXPIRES_IN = '7d'

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  userId: number
  username: string
  roleId: number
}

/**
 * JWT token management service
 */
export class JwtService {
  /**
   * Sign and generate JWT token
   */
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  /**
   * Verify and decode JWT token
   */
  verify(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  }
}
