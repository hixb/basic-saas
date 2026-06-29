import type { NewSocialPlatformConfig, SocialPlatformConfig } from '~/server/infrastructure/database/schema/social-platform-config.schema'
import { and, asc, count, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { socialPlatformConfigs, SocialPlatformConfigStatus } from '~/server/infrastructure/database/schema/social-platform-config.schema'

/**
 * Repository for social platform integration settings.
 */
export class SocialPlatformConfigRepository {
  /**
   * Find platform settings with pagination.
   */
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: SocialPlatformConfig[], total: number }> {
    const where = params.keyword
      ? or(
          ilike(socialPlatformConfigs.platform, `%${params.keyword}%`),
          ilike(socialPlatformConfigs.displayName, `%${params.keyword}%`),
          ilike(socialPlatformConfigs.clientId, `%${params.keyword}%`),
          ilike(socialPlatformConfigs.apiBaseUrl, `%${params.keyword}%`),
        )
      : undefined

    const orderBy = params.sortDirection === 'ascending'
      ? asc(socialPlatformConfigs.createdAt)
      : desc(socialPlatformConfigs.createdAt)

    const data = await db
      .select()
      .from(socialPlatformConfigs)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db.select({ value: count() }).from(socialPlatformConfigs).where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Find all active platform settings.
   */
  async findActive(): Promise<SocialPlatformConfig[]> {
    return db
      .select()
      .from(socialPlatformConfigs)
      .where(eq(socialPlatformConfigs.status, SocialPlatformConfigStatus.ACTIVE))
      .orderBy(asc(socialPlatformConfigs.displayName))
  }

  /**
   * Find active settings for selected platforms.
   */
  async findActiveByPlatforms(platforms: string[]): Promise<SocialPlatformConfig[]> {
    if (platforms.length === 0)
      return []

    return db
      .select()
      .from(socialPlatformConfigs)
      .where(and(
        inArray(socialPlatformConfigs.platform, platforms),
        eq(socialPlatformConfigs.status, SocialPlatformConfigStatus.ACTIVE),
      ))
  }

  /**
   * Create platform settings.
   */
  async create(data: NewSocialPlatformConfig): Promise<SocialPlatformConfig> {
    const result = await db.insert(socialPlatformConfigs).values(data).returning()
    return result[0]
  }

  /**
   * Update platform settings.
   */
  async update(id: number, data: Partial<NewSocialPlatformConfig>): Promise<SocialPlatformConfig | null> {
    const result = await db
      .update(socialPlatformConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(socialPlatformConfigs.id, id))
      .returning()

    return result[0] ?? null
  }

  /**
   * Delete platform settings.
   */
  async delete(id: number): Promise<void> {
    await db.delete(socialPlatformConfigs).where(eq(socialPlatformConfigs.id, id))
  }
}
