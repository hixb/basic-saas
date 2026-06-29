import type { ApiResponse } from '~/shared/types/api.type'
import { ResponseCode } from '~/shared/types/api.type'

export class ApiResponseError extends Error {
  response: ApiResponse

  constructor(response: ApiResponse) {
    super(response.message)
    this.name = 'ApiResponseError'
    this.response = response
  }
}

export function isApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== 'object')
    return false

  return 'code' in value && 'message' in value && 'data' in value
}

export function ensureApiSuccess(value: unknown) {
  if (isApiResponse(value) && value.code !== ResponseCode.SUCCESS)
    throw new ApiResponseError(value)

  return value
}
