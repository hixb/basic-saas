import type { UploadedMaterial } from '~/server/infrastructure/database/schema/uploaded-material.schema'
import { MaterialCategoryRepository } from '~/server/infrastructure/database/repositories/material-category.repository'
import { UploadedMaterialRepository } from '~/server/infrastructure/database/repositories/uploaded-material.repository'
import { R2StorageService } from '~/server/infrastructure/storage/r2.service'

export interface PublicMaterialView extends UploadedMaterial {
  categoryName: string
  coverUrl: string | null
  fileUrl: string | null
}

const materialRepository = new UploadedMaterialRepository()
const categoryRepository = new MaterialCategoryRepository()
const storage = new R2StorageService()

async function decorateMaterials(materials: UploadedMaterial[]): Promise<PublicMaterialView[]> {
  const categories = await categoryRepository.findActive()
  const categoryNameBySlug = new Map(categories.map(category => [category.slug, category.name]))

  return materials.map(material => ({
    ...material,
    categoryName: categoryNameBySlug.get(material.category) ?? material.category,
    coverUrl: storage.getPublicUrl(material.coverKey),
    fileUrl: storage.getPublicUrl(material.fileKey),
  }))
}

/**
 * Finds published public materials for the website.
 */
export async function findPublicMaterials(params: {
  page: number
  pageSize: number
}): Promise<{ data: PublicMaterialView[], total: number }> {
  const result = await materialRepository.findPublishedPaginated(params)
  const data = await decorateMaterials(result.data)

  return { data, total: result.total }
}

/**
 * Finds a published material detail for SEO-rendered public pages.
 */
export async function findPublicMaterialById(id: number): Promise<PublicMaterialView | null> {
  const material = await materialRepository.findPublishedById(id)

  if (!material)
    return null

  const decorated = await decorateMaterials([material])
  return decorated[0] ?? null
}
