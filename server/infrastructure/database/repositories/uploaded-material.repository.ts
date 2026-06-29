import type { NewUploadedMaterial, UploadedMaterial } from '~/server/infrastructure/database/schema/uploaded-material.schema'
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { uploadedMaterials, UploadedMaterialStatus } from '~/server/infrastructure/database/schema/uploaded-material.schema'

/**
 * Repository for admin-managed public materials.
 */
export class UploadedMaterialRepository {
  /**
   * Find uploaded materials with pagination.
   */
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: UploadedMaterial[], total: number }> {
    const where = params.keyword
      ? or(
          ilike(uploadedMaterials.title, `%${params.keyword}%`),
          ilike(uploadedMaterials.summary, `%${params.keyword}%`),
          ilike(uploadedMaterials.category, `%${params.keyword}%`),
          ilike(uploadedMaterials.fileName, `%${params.keyword}%`),
        )
      : undefined

    const orderBy = params.sortDirection === 'ascending'
      ? asc(uploadedMaterials.createdAt)
      : desc(uploadedMaterials.createdAt)

    const data = await db
      .select()
      .from(uploadedMaterials)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db.select({ value: count() }).from(uploadedMaterials).where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Find uploaded materials for export.
   */
  async findForExport(params: {
    keyword?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<UploadedMaterial[]> {
    const where = params.keyword
      ? or(
          ilike(uploadedMaterials.title, `%${params.keyword}%`),
          ilike(uploadedMaterials.summary, `%${params.keyword}%`),
          ilike(uploadedMaterials.category, `%${params.keyword}%`),
          ilike(uploadedMaterials.fileName, `%${params.keyword}%`),
        )
      : undefined

    const orderBy = params.sortDirection === 'ascending'
      ? asc(uploadedMaterials.createdAt)
      : desc(uploadedMaterials.createdAt)

    return db
      .select()
      .from(uploadedMaterials)
      .where(where)
      .orderBy(orderBy)
      .limit(5000)
  }

  /**
   * Find published materials with pagination.
   */
  async findPublishedPaginated(params: {
    page: number
    pageSize: number
  }): Promise<{ data: UploadedMaterial[], total: number }> {
    const where = eq(uploadedMaterials.status, UploadedMaterialStatus.PUBLISHED)

    const data = await db
      .select()
      .from(uploadedMaterials)
      .where(where)
      .orderBy(desc(uploadedMaterials.createdAt))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db.select({ value: count() }).from(uploadedMaterials).where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Find a published material by ID.
   */
  async findPublishedById(id: number): Promise<UploadedMaterial | null> {
    const result = await db
      .select()
      .from(uploadedMaterials)
      .where(eq(uploadedMaterials.id, id))
      .limit(1)

    const material = result[0]

    if (!material || material.status !== UploadedMaterialStatus.PUBLISHED)
      return null

    return material
  }

  /**
   * Find a material by ID for admin editing.
   */
  async findById(id: number): Promise<UploadedMaterial | null> {
    const result = await db
      .select()
      .from(uploadedMaterials)
      .where(eq(uploadedMaterials.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Create material content record.
   */
  async create(data: NewUploadedMaterial): Promise<UploadedMaterial> {
    const result = await db.insert(uploadedMaterials).values(data).returning()
    return result[0]
  }

  /**
   * Update material content record.
   */
  async update(id: number, data: Partial<NewUploadedMaterial>): Promise<UploadedMaterial | null> {
    const result = await db
      .update(uploadedMaterials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(uploadedMaterials.id, id))
      .returning()

    return result[0] ?? null
  }

  /**
   * Delete material content record.
   */
  async delete(id: number): Promise<void> {
    await db.delete(uploadedMaterials).where(eq(uploadedMaterials.id, id))
  }
}
