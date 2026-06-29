/**
 * API response structure from backend
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta
}

/**
 * Response metadata (optional)
 */
export interface ResponseMeta {
  requestId: string
  traceId?: string
  timestamp: string
}

/**
 * Extended response with metadata
 */
export interface ApiResponseWithMeta<T = unknown> extends ApiResponse<T> {
  meta?: ResponseMeta
}

/**
 * API Response Codes
 */
export const ResponseCode = {
  /** Success */
  SUCCESS: 200,

  /** Bad request */
  BAD_REQUEST: 1000,
  /** Unauthorized */
  UNAUTHORIZED: 1001,
  /** Forbidden */
  FORBIDDEN: 1002,
  /** Not found */
  NOT_FOUND: 1003,
  /** Conflict */
  CONFLICT: 1004,
  /** Validation error */
  VALIDATION_ERROR: 1005,
  /** Rate limited */
  RATE_LIMITED: 1006,
  /** Payload too large */
  PAYLOAD_TOO_LARGE: 1007,

  /** Internal server error */
  INTERNAL_ERROR: 5000,
  /** Service unavailable */
  SERVICE_UNAVAILABLE: 5001,
  /** Database error */
  DATABASE_ERROR: 5002,
  /** External service error */
  EXTERNAL_SERVICE_ERROR: 5003,
} as const

export type ResponseCodeType = (typeof ResponseCode)[keyof typeof ResponseCode]
