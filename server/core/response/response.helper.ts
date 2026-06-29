import type { ApiResponse, PaginatedResponse, PaginationMeta, ResponseCodeType, ResponseMeta } from '~/shared/types/api.type'
import { NextResponse } from 'next/server'
import { getRequestContext } from '../context/request.context'
import { CodeToHttpStatus, ResponseCode, ResponseMessage } from './response.code'

/**
 * Create a success response
 */
export function success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    code: ResponseCode.SUCCESS,
    message: message ?? ResponseMessage[ResponseCode.SUCCESS],
    data,
  }

  return NextResponse.json(response, { status: 200 }) as NextResponse<ApiResponse<T>>
}

/**
 * Create a success response with metadata
 */
export function successWithMeta<T>(data: T, message?: string): NextResponse<ApiResponse<T> & { meta: ResponseMeta }> {
  const ctx = getRequestContext()

  const response = {
    code: ResponseCode.SUCCESS,
    message: message ?? ResponseMessage[ResponseCode.SUCCESS],
    data,
    meta: {
      requestId: ctx?.requestId ?? '',
      traceId: ctx?.traceId,
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 200 }) as NextResponse<ApiResponse<T> & { meta: ResponseMeta }>
}

/**
 * Create a failure response
 */
export function fail(code: ResponseCodeType, message?: string, data?: unknown): NextResponse<ApiResponse<unknown>> {
  const response: ApiResponse<unknown> = {
    code,
    message: message ?? ResponseMessage[code] ?? 'Unknown error',
    data: data ?? null,
  }

  const httpStatus = CodeToHttpStatus[code] ?? 500

  return NextResponse.json(response, { status: httpStatus }) as NextResponse<ApiResponse<unknown>>
}

/**
 * Create a failure response with custom HTTP status
 */
export function failWithStatus(
  code: ResponseCodeType,
  httpStatus: number,
  message?: string,
  data?: unknown,
): NextResponse<ApiResponse<unknown>> {
  const response: ApiResponse<unknown> = {
    code,
    message: message ?? ResponseMessage[code] ?? 'Unknown error',
    data: data ?? null,
  }

  return NextResponse.json(response, { status: httpStatus }) as NextResponse<ApiResponse<unknown>>
}

/**
 * Create a paginated response
 */
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
): NextResponse<PaginatedResponse<T>> {
  const response: PaginatedResponse<T> = {
    code: ResponseCode.SUCCESS,
    message: message ?? ResponseMessage[ResponseCode.SUCCESS],
    data,
    pagination,
  }

  return NextResponse.json(response, { status: 200 }) as NextResponse<PaginatedResponse<T>>
}

/**
 * Calculate pagination metadata from query params
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

export const ok = success
export const created = <T>(data: T, message = 'Created successfully') => success(data, message)
export const updated = <T>(data: T, message = 'Updated successfully') => success(data, message)
export const deleted = (message = 'Deleted successfully') => success(null, message)

export function badRequest(message?: string, data?: unknown) {
  return fail(ResponseCode.BAD_REQUEST, message, data)
}
export function unauthorized(message?: string) {
  return fail(ResponseCode.UNAUTHORIZED, message)
}
export function forbidden(message?: string) {
  return fail(ResponseCode.FORBIDDEN, message)
}
export function notFound(message?: string) {
  return fail(ResponseCode.NOT_FOUND, message)
}
export function conflict(message?: string, data?: unknown) {
  return fail(ResponseCode.CONFLICT, message, data)
}
export function validationError(message?: string, data?: unknown) {
  return fail(ResponseCode.VALIDATION_ERROR, message, data)
}
export function internalError(message?: string) {
  return fail(ResponseCode.INTERNAL_ERROR, message)
}
