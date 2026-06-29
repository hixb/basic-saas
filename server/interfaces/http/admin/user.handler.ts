import type { NextRequest } from 'next/server'
import { calculatePagination, paginated } from '~/server/core/response/response.helper'
import { UserRepository } from '~/server/infrastructure/database/repositories/user.repository'

const userRepository = new UserRepository()

/**
 * Handle admin user list request.
 */
export async function handleGetAdminUsers(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortColumn = searchParams.get('sort') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'

  const result = await userRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortColumn,
    sortDirection,
  })

  const data = result.data.map(({ password, ...user }) => user)
  return paginated(data, calculatePagination(result.total, page, pageSize))
}
