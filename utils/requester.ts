'use client'

import type { ApiResponse } from '~/shared/types/api.type'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export interface ExtensionRequestInit extends RequestInit {
  method?: HttpMethod
}

export interface RequestInterceptor {
  onFulfilled?: (config: ExtensionRequestInit) => ExtensionRequestInit
  onRejected?: (error: unknown) => unknown
}

export interface ResponseInterceptor<T = any> {
  onFulfilled?: (response: ApiResponse<T>) => ApiResponse<T>
  onRejected?: (error: unknown) => unknown
}

export interface FetchOptions {
  baseUrl?: string
  timeout?: number
  requestInterceptors?: RequestInterceptor[]
  responseInterceptors?: ResponseInterceptor[]
  onError?: (error: HttpError | TimeoutError) => void
}

export interface FetchClient {
  request: <T>(url: string, config?: ExtensionRequestInit, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
  get: <T, Q extends Record<string, unknown> = Record<string, unknown>>(url: string, query?: Q, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
  post: <T, B = unknown>(url: string, body?: B, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
  put: <T, B = unknown>(url: string, body?: B, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
  patch: <T, B = unknown>(url: string, body?: B, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
  del: <T, B = unknown>(url: string, body?: B, usePrefix?: boolean, timeout?: number) => Promise<ApiResponse<T>>
}

function buildQueryString(query?: Record<string, unknown>) {
  if (!query)
    return ''
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null)
      continue
    qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function requester(options: FetchOptions = {}): FetchClient {
  const defaultTimeout = options.timeout ?? 3000000
  const baseUrl = options.baseUrl ?? ''
  const requestInterceptors = options.requestInterceptors ?? []
  const responseInterceptors = options.responseInterceptors ?? []

  const request = async <T>(
    url: string,
    config: ExtensionRequestInit = {},
    usePrefix = true,
    timeout = defaultTimeout,
  ): Promise<ApiResponse<T>> => {
    try {
      let currentConfig: ExtensionRequestInit = { ...config }

      for (const interceptor of requestInterceptors) {
        if (interceptor.onFulfilled)
          currentConfig = interceptor.onFulfilled(currentConfig)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await Promise.race([
        fetch(`${usePrefix ? baseUrl : ''}${url}`, { ...currentConfig, signal: controller.signal }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new TimeoutError(`Request timed out after ${timeout}ms`)), timeout),
        ),
      ])

      clearTimeout(timeoutId)

      let result: ApiResponse<T>
      try {
        result = await response.json() as ApiResponse<T>
      }
      catch {
        result = {
          code: response.ok ? 0 : response.status,
          message: response.ok ? 'Success' : `HTTP error! status: ${response.status}`,
          data: null,
        }
      }

      for (const interceptor of responseInterceptors) {
        if (interceptor.onFulfilled)
          result = interceptor.onFulfilled(result as any) as any
      }

      if (!response.ok || result.code !== 0) {
        const httpErr = new HttpError(response.status, result.message)
        options.onError?.(httpErr)
      }

      return result
    }
    catch (e: unknown) {
      let err: unknown = e
      for (const interceptor of responseInterceptors) {
        if (interceptor.onRejected)
          err = interceptor.onRejected(err)
      }

      const finalError
        = err instanceof HttpError || err instanceof TimeoutError
          ? err
          : new HttpError(0, err instanceof Error ? err.message : String(err))

      options.onError?.(finalError)
      return { code: 5000, message: finalError.message, data: null }
    }
  }

  const get = <T, Q extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    query?: Q,
    usePrefix = true,
    timeout?: number,
  ) => request<T>(`${url}${buildQueryString(query)}`, { method: 'GET' }, usePrefix, timeout)

  const post = <T, B = unknown>(
    url: string,
    body?: B,
    usePrefix = true,
    timeout?: number,
  ) => request<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) }, usePrefix, timeout)

  const put = <T, B = unknown>(
    url: string,
    body?: B,
    usePrefix = true,
    timeout?: number,
  ) => request<T>(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) }, usePrefix, timeout)

  const patch = <T, B = unknown>(
    url: string,
    body?: B,
    usePrefix = true,
    timeout?: number,
  ) => request<T>(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) }, usePrefix, timeout)

  const del = <T, B = unknown>(
    url: string,
    body?: B,
    usePrefix = true,
    timeout?: number,
  ) => request<T>(url, { method: 'DELETE', headers: body == null ? undefined : { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) }, usePrefix, timeout)

  return { request, get, post, put, patch, del }
}
