import type { NextRequest } from 'next/server'
import type { ValidationErrorData } from '~/shared/types/api.type'
import { calculatePagination, created, fail, paginated } from '~/server/core/response/response.helper'
import { findSensitiveWordMatches } from '~/server/domain/content/sensitive-word-policy'
import { CustomerInquiryRepository } from '~/server/infrastructure/database/repositories/customer-inquiry.repository'
import { SensitiveWordRepository } from '~/server/infrastructure/database/repositories/sensitive-word.repository'
import { fetchGeoByIp, getClientIp } from '~/server/infrastructure/geo/ip-geo.service'
import { createInquirySchema } from '~/shared/schemas/content.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const inquiryRepository = new CustomerInquiryRepository()
const sensitiveWordRepository = new SensitiveWordRepository()

/**
 * Handle public inquiry submission.
 */
export async function handleCreateInquiry(request: NextRequest) {
  const body = await request.json()
  const clientIp = getClientIp(request)
  const validation = createInquirySchema.safeParse(body)

  if (!validation.success) {
    return fail(
      ResponseCode.INVALID_FORM_INPUT,
      'Invalid form input',
      mapValidationIssue(validation.error.issues[0]),
    )
  }

  const activeWords = await sensitiveWordRepository.findActive()
  const matches = findSensitiveWordMatches(validation.data.description, activeWords)

  if (matches.length) {
    return fail(
      ResponseCode.SENSITIVE_CONTENT_DETECTED,
      'Sensitive content detected',
      {
        reason: 'sensitive_content',
        field: 'description',
        matches,
      } satisfies ValidationErrorData,
    )
  }

  const inquiry = await inquiryRepository.create({
    contactName: validation.data.contactName,
    companyName: validation.data.companyName,
    email: validation.data.email,
    phone: validation.data.phone,
    description: validation.data.description,
    ip: clientIp,
    emoji: '🏳️',
    sensitiveHit: false,
    matchedSensitiveWords: [],
  })

  fetchGeoByIp(clientIp).then(async (geo) => {
    if (!geo)
      return

    await inquiryRepository.updateGeo(inquiry.id, geo)
  }).catch(() => undefined)

  return created({ id: inquiry.id, status: inquiry.status })
}

/**
 * Handle admin inquiry list request.
 */
export async function handleGetAdminInquiries(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'

  const result = await inquiryRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}
