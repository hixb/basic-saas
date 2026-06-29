import type { ResponseCodeType } from '~/shared/types/api.type'
import { ResponseCode } from '~/shared/types/api.type'

/**
 * Default messages for response codes
 */
export const ResponseMessage: Record<ResponseCodeType, string> = {
  [ResponseCode.SUCCESS]: 'Success',
  [ResponseCode.BAD_REQUEST]: 'Bad request',
  [ResponseCode.UNAUTHORIZED]: 'Unauthorized',
  [ResponseCode.FORBIDDEN]: 'Forbidden',
  [ResponseCode.NOT_FOUND]: 'Not found',
  [ResponseCode.CONFLICT]: 'Conflict',
  [ResponseCode.VALIDATION_ERROR]: 'Validation failed',
  [ResponseCode.RATE_LIMITED]: 'Rate limit exceeded',
  [ResponseCode.PAYLOAD_TOO_LARGE]: 'Payload too large',
  [ResponseCode.INTERNAL_ERROR]: 'Internal server error',
  [ResponseCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
  [ResponseCode.DATABASE_ERROR]: 'Database error',
  [ResponseCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
}

/**
 * HTTP status code mapping
 */
export const CodeToHttpStatus: Record<ResponseCodeType, number> = {
  [ResponseCode.SUCCESS]: 200,
  [ResponseCode.BAD_REQUEST]: 400,
  [ResponseCode.UNAUTHORIZED]: 401,
  [ResponseCode.FORBIDDEN]: 403,
  [ResponseCode.NOT_FOUND]: 404,
  [ResponseCode.CONFLICT]: 409,
  [ResponseCode.VALIDATION_ERROR]: 422,
  [ResponseCode.RATE_LIMITED]: 429,
  [ResponseCode.PAYLOAD_TOO_LARGE]: 413,
  [ResponseCode.INTERNAL_ERROR]: 500,
  [ResponseCode.SERVICE_UNAVAILABLE]: 503,
  [ResponseCode.DATABASE_ERROR]: 500,
  [ResponseCode.EXTERNAL_SERVICE_ERROR]: 502,
}

export { ResponseCode, type ResponseCodeType }
