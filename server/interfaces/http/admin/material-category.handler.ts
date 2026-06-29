import type { NextRequest } from 'next/server'
import { calculatePagination, created, deleted, fail, ok, paginated, updated } from '~/server/core/response/response.helper'
import { MaterialCategoryRepository } from '~/server/infrastructure/database/repositories/material-category.repository'
import { materialCategorySchema } from '~/shared/schemas/content.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const categoryRepository = new MaterialCategoryRepository()

/**
 * Handle admin material category list request.
 */
export async function handleGetMaterialCategories(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'
  const activeOnly = searchParams.get('activeOnly') === 'true'

  if (activeOnly) {
    const categories = await categoryRepository.findActive()
    return ok(categories)
  }

  const result = await categoryRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Handle material category creation request.
 */
export async function handleCreateMaterialCategory(request: NextRequest) {
  const body = await request.json()
  const validation = materialCategorySchema.safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const category = await categoryRepository.create(validation.data)
  return created(category)
}

/**
 * Handle material category update request.
 */
export async function handleUpdateMaterialCategory(request: NextRequest, id: number) {
  const body = await request.json()
  const validation = materialCategorySchema.partial().safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const category = await categoryRepository.update(id, validation.data)
  return updated(category)
}

/**
 * Handle material category deletion request.
 */
export async function handleDeleteMaterialCategory(id: number) {
  await categoryRepository.delete(id)
  return deleted()
}
