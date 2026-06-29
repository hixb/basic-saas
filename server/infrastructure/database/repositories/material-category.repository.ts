import type { MaterialCategory, NewMaterialCategory } from '~/server/infrastructure/database/schema/material-category.schema'
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { materialCategories, MaterialCategoryStatus } from '~/server/infrastructure/database/schema/material-category.schema'

/**
 * Repository for material category data access operations.
 */
export class MaterialCategoryRepository {
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: MaterialCategory[], total: number }> {
    const where = params.keyword
      ? or(
          ilike(materialCategories.name, `%${params.keyword}%`),
          ilike(materialCategories.slug, `%${params.keyword}%`),
          ilike(materialCategories.description, `%${params.keyword}%`),
        )
      : undefined

    const orderBy = params.sortDirection === 'ascending'
      ? asc(materialCategories.createdAt)
      : desc(materialCategories.createdAt)

    const data = await db
      .select()
      .from(materialCategories)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db.select({ value: count() }).from(materialCategories).where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  async findActive(): Promise<MaterialCategory[]> {
    return db
      .select()
      .from(materialCategories)
      .where(eq(materialCategories.status, MaterialCategoryStatus.ACTIVE))
      .orderBy(asc(materialCategories.name))
  }

  async create(data: NewMaterialCategory): Promise<MaterialCategory> {
    const result = await db.insert(materialCategories).values(data).returning()
    return result[0]
  }

  async update(id: number, data: Partial<NewMaterialCategory>): Promise<MaterialCategory> {
    const result = await db
      .update(materialCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(materialCategories.id, id))
      .returning()

    return result[0]
  }

  async delete(id: number): Promise<void> {
    await db.delete(materialCategories).where(eq(materialCategories.id, id))
  }
}
