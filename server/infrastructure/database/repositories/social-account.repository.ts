import type { NewSocialAccount, SocialAccount } from '~/server/infrastructure/database/schema/social-account.schema'
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

  /**
   * Create or update a connected social account by platform account ID.
   */
  async upsertByPlatformAccount(data: NewSocialAccount): Promise<SocialAccount> {
    if (!data.platformAccountId)
      throw new Error('Platform account ID is required')

    const existing = await db
      .select()
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, data.userId),
        eq(socialAccounts.platform, data.platform),
        eq(socialAccounts.platformAccountId, data.platformAccountId),
      ))
      .limit(1)

    const existingAccount = existing[0]

    if (existingAccount) {
      const updated = await db
        .update(socialAccounts)
        .set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          expiresAt: data.expiresAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(socialAccounts.id, existingAccount.id))
        .returning()

      return updated[0]
    }

    const created = await db.insert(socialAccounts).values(data).returning()
    return created[0]
  }
}
