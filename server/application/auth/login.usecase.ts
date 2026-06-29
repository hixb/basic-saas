import type { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'
import type { LoginLogRepository } from '~/server/infrastructure/logging/login-log.repository'
import type { JwtService } from '~/server/infrastructure/security/jwt.service'
import type { LoginInput } from '~/shared/schemas/auth.schema'
import { compare } from 'bcryptjs'

/**
 * User login use case
 */
export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private loginLogRepository: LoginLogRepository,
  ) {}

  /**
   * Execute user login
   */
  async execute(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      await this.loginLogRepository.logFailure(input.email, 'Invalid credentials')
      throw new Error('Invalid credentials')
    }

    if (user.status !== 1) {
      await this.loginLogRepository.logFailure(input.email, 'Account is disabled', user.id)
      throw new Error('Account is disabled')
    }

    const isValid = await compare(input.password, user.password)
    if (!isValid) {
      await this.loginLogRepository.logFailure(input.email, 'Invalid credentials', user.id)
      throw new Error('Invalid credentials')
    }

    await this.loginLogRepository.logSuccess(user.id, input.email)

    const token = this.jwtService.sign({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
    })

    const { password, ...userWithoutPassword } = user
    return { user: userWithoutPassword, token }
  }
}
