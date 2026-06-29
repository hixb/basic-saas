import type { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'
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
  ) {}

  /**
   * Execute user login
   */
  async execute(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    if (user.status !== 1) {
      throw new Error('Account is disabled')
    }

    const isValid = await compare(input.password, user.password)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    const token = this.jwtService.sign({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
    })

    const { password, ...userWithoutPassword } = user
    return { user: userWithoutPassword, token }
  }
}
