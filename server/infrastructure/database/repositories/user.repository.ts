import type { NewUser, User } from '~/server/infrastructure/database/schema/user.schema'
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { users } from '~/server/infrastructure/database/schema/user.schema'

/**
 * Repository for user data access operations
 */
export class UserRepository {
  /**
   * Find users with pagination.
   */
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    status?: number
    sortColumn?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: User[], total: number }> {
    const where = params.keyword
      ? or(
          ilike(users.username, `%${params.keyword}%`),
          ilike(users.email, `%${params.keyword}%`),
          ilike(users.nickname, `%${params.keyword}%`),
        )
      : undefined

    const orderColumn = params.sortColumn === 'email'
      ? users.email
      : params.sortColumn === 'username'
        ? users.username
        : users.createdAt

    const orderBy = params.sortDirection === 'ascending'
      ? asc(orderColumn)
      : desc(orderColumn)

    const data = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db
      .select({ value: count() })
      .from(users)
      .where(where)

    return {
      data,
      total: totalResult[0]?.value ?? 0,
    }
  }

  /**
   * Find user by identifier.
   */
  async findById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id))
    return result[0] ?? null
  }

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

  /**
   * Update existing user record.
   */
  async update(id: number, data: Partial<NewUser>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    return result[0]
  }
}
