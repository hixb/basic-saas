import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

/**
 * Request context stored in AsyncLocalStorage
 */
export interface RequestContext {
  requestId: string
  traceId?: string
  startTime: number
  userId?: number
  userAgent?: string
  ip?: string
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Create a new request context
 */
export function createRequestContext(traceId?: string): RequestContext {
  return {
    requestId: randomUUID(),
    traceId: traceId ?? randomUUID(),
    startTime: Date.now(),
  }
}

/**
 * Run a function within a request context
 */
export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return requestContextStorage.run(context, fn)
}

/**
 * Get the current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}

/**
 * Get the current request ID
 */
export function getRequestId(): string | undefined {
  return getRequestContext()?.requestId
}

/**
 * Get the current trace ID
 */
export function getTraceId(): string | undefined {
  return getRequestContext()?.traceId
}

/**
 * Update the current request context
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
  const ctx = getRequestContext()
  if (ctx) {
    Object.assign(ctx, updates)
  }
}
