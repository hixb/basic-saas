import type { NewRole, Role } from '~/server/infrastructure/database/schema/role.schema'
import { eq } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { roles } from '~/server/infrastructure/database/schema/role.schema'

/**
 * Repository for role data access operations.
 */
export class RoleRepository {
  /**
   * Find role by name.
   */
  async findByName(name: string): Promise<Role | null> {
    const result = await db.select().from(roles).where(eq(roles.name, name))
    return result[0] ?? null
  }

  /**
   * Create new role record.
   */
  async create(data: NewRole): Promise<Role> {
    const result = await db.insert(roles).values(data).returning()
    return result[0]
  }
}
