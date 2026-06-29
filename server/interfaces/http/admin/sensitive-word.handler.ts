import type { NextRequest } from 'next/server'
import { calculatePagination, created, deleted, fail, paginated, updated } from '~/server/core/response/response.helper'
import { SensitiveWordRepository } from '~/server/infrastructure/database/repositories/sensitive-word.repository'
import { sensitiveWordSchema } from '~/shared/schemas/content.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const sensitiveWordRepository = new SensitiveWordRepository()

/**
 * Handle admin sensitive word list request.
 */
export async function handleGetSensitiveWords(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'

  const result = await sensitiveWordRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Handle sensitive word creation request.
 */
export async function handleCreateSensitiveWord(request: NextRequest) {
  const body = await request.json()
  const validation = sensitiveWordSchema.safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const word = await sensitiveWordRepository.create(validation.data)
  return created(word)
}

/**
 * Handle sensitive word update request.
 */
export async function handleUpdateSensitiveWord(request: NextRequest, id: number) {
  const body = await request.json()
  const validation = sensitiveWordSchema.partial().safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const word = await sensitiveWordRepository.update(id, validation.data)
  return updated(word)
}

/**
 * Handle sensitive word deletion request.
 */
export async function handleDeleteSensitiveWord(id: number) {
  await sensitiveWordRepository.delete(id)
  return deleted()
}
