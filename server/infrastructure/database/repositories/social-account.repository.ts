import type { SocialAccount } from '~/server/infrastructure/database/schema/social-account.schema'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { socialAccounts } from '~/server/infrastructure/database/schema/social-account.schema'

/**
 * Repository for connected social publishing accounts.
 */
export class SocialAccountRepository {
  /**
   * Find publish-capable accounts for a user.
   */
  async findByUserId(userId: number): Promise<SocialAccount[]> {
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId))
      .orderBy(socialAccounts.id)
  }

  /**
   * Find selected publish accounts for a user.
   */
  async findByUserIdAndPlatforms(userId: number, platforms: string[]): Promise<SocialAccount[]> {
    if (platforms.length === 0)
      return []

    return db
      .select()
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        inArray(socialAccounts.platform, platforms),
      ))
      .orderBy(socialAccounts.id)
  }
}
