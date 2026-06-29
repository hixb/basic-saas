import type { NextRequest } from 'next/server'
import type { NewSocialPlatformConfig } from '~/server/infrastructure/database/schema/social-platform-config.schema'
import type { SocialPlatformConfigInput } from '~/shared/schemas/social-platform.schema'
import { calculatePagination, created, deleted, fail, notFound, paginated, updated } from '~/server/core/response/response.helper'
import { SocialPlatformConfigRepository } from '~/server/infrastructure/database/repositories/social-platform-config.repository'
import { socialPlatformConfigSchema } from '~/shared/schemas/social-platform.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const platformConfigRepository = new SocialPlatformConfigRepository()

/**
 * Handle admin social platform config list request.
 */
export async function handleGetSocialPlatformConfigs(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'
  const activeOnly = searchParams.get('activeOnly') === 'true'

  if (activeOnly) {
    const configs = await platformConfigRepository.findActive()
    return paginated(configs, calculatePagination(configs.length, 1, Math.max(configs.length, 1)))
  }

  const result = await platformConfigRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Handle admin social platform config creation.
 */
export async function handleCreateSocialPlatformConfig(request: NextRequest) {
  const body = await request.json()
  const validation = socialPlatformConfigSchema.safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const platformConfig = await platformConfigRepository.create(normalizeCreateInput(validation.data))
  return created(platformConfig)
}

/**
 * Handle admin social platform config update.
 */
export async function handleUpdateSocialPlatformConfig(request: NextRequest, id: number) {
  const body = await request.json()
  const validation = socialPlatformConfigSchema.partial().safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const platformConfig = await platformConfigRepository.update(id, normalizePlatformConfigInput(validation.data))

  if (!platformConfig)
    return notFound('Social platform config not found')

  return updated(platformConfig)
}

/**
 * Handle admin social platform config deletion.
 */
export async function handleDeleteSocialPlatformConfig(id: number) {
  await platformConfigRepository.delete(id)
  return deleted()
}

function normalizeCreateInput(data: SocialPlatformConfigInput): NewSocialPlatformConfig {
  return {
    ...data,
    publishEndpoint: data.publishEndpoint || null,
    uploadEndpoint: data.uploadEndpoint || null,
  }
}

function normalizePlatformConfigInput(data: Partial<NewSocialPlatformConfig>): Partial<NewSocialPlatformConfig> {
  return {
    ...data,
    publishEndpoint: data.publishEndpoint || null,
    uploadEndpoint: data.uploadEndpoint || null,
  }
}
