import type { NewLoginLog } from '~/server/infrastructure/database/schema/login-log.schema'
import { db } from '~/server/infrastructure/database'
import { loginLogs, LoginStatus } from '~/server/infrastructure/database/schema/login-log.schema'

/**
 * Repository for login attempt logs.
 */
export class LoginLogRepository {
  /**
   * Create login log record.
   */
  async create(data: NewLoginLog) {
    const result = await db.insert(loginLogs).values(data).returning()
    return result[0]
  }

  /**
   * Log successful login attempt.
   */
  async logSuccess(userId: number, username: string): Promise<void> {
    await this.create({
      userId,
      username,
      status: LoginStatus.SUCCESS,
    })
  }

  /**
   * Log failed login attempt.
   */
  async logFailure(username: string, reason: string, userId?: number): Promise<void> {
    await this.create({
      userId: userId ?? null,
      username,
      status: LoginStatus.FAILED,
      failureReason: reason,
    })
  }
}
