import type { NewSensitiveWord, SensitiveWord } from '~/server/infrastructure/database/schema/sensitive-word.schema'
import { asc, count, desc, eq, ilike } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { sensitiveWords, SensitiveWordStatus } from '~/server/infrastructure/database/schema/sensitive-word.schema'

/**
 * Repository for sensitive word data access operations.
 */
export class SensitiveWordRepository {
  /**
   * Find sensitive words with pagination.
   */
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: SensitiveWord[], total: number }> {
    const where = params.keyword ? ilike(sensitiveWords.word, `%${params.keyword}%`) : undefined
    const orderBy = params.sortDirection === 'ascending'
      ? asc(sensitiveWords.createdAt)
      : desc(sensitiveWords.createdAt)

    const data = await db
      .select()
      .from(sensitiveWords)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db.select({ value: count() }).from(sensitiveWords).where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Find active sensitive words.
   */
  async findActive(): Promise<SensitiveWord[]> {
    return db
      .select()
      .from(sensitiveWords)
      .where(eq(sensitiveWords.status, SensitiveWordStatus.ACTIVE))
      .orderBy(asc(sensitiveWords.word))
  }

  /**
   * Create new sensitive word record.
   */
  async create(data: NewSensitiveWord): Promise<SensitiveWord> {
    const result = await db.insert(sensitiveWords).values(data).returning()
    return result[0]
  }

  /**
   * Update existing sensitive word record.
   */
  async update(id: number, data: Partial<NewSensitiveWord>): Promise<SensitiveWord> {
    const result = await db
      .update(sensitiveWords)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sensitiveWords.id, id))
      .returning()

    return result[0]
  }

  /**
   * Delete sensitive word record.
   */
  async delete(id: number): Promise<void> {
    await db.delete(sensitiveWords).where(eq(sensitiveWords.id, id))
  }
}
