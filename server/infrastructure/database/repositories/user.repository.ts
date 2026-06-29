import type { NewUser, User } from '~/server/infrastructure/database/schema/user.schema'
import { eq } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { users } from '~/server/infrastructure/database/schema/user.schema'

/**
 * Repository for user data access operations
 */
export class UserRepository {
  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username))
    return result[0] ?? null
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email))
    return result[0] ?? null
  }

  /**
   * Create new user record
   */
  async create(data: NewUser): Promise<User> {
    const result = await db.insert(users).values(data).returning()
    return result[0]
  }
}
