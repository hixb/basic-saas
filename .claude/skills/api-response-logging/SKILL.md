---
name: api-response-logging
description: Standardized API response structure and enterprise logging system. Use when implementing API endpoints, handling responses, or adding request/audit logging.
user-invocable: false
---

# API Response & Logging Specification

Standardized API response structure and enterprise-level logging system for the SaaS template.

## Response Types

### Core Response Interface

```typescript
// server/core/response/response.type.ts

/**
 * Standard API response structure
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
```

## Response Codes

### Code Constants

```typescript
// server/core/response/response.code.ts

/**
 * API Response Codes
 *
 * Code ranges:
 * - 0: Success
 * - 1000-1999: Client errors
 * - 5000-5999: Server errors
 */
export const ResponseCode = {
  // Success (0)
  SUCCESS: 0,

  // Client errors (1000-1999)
  BAD_REQUEST: 1000,
  UNAUTHORIZED: 1001,
  FORBIDDEN: 1002,
  NOT_FOUND: 1003,
  CONFLICT: 1004,
  VALIDATION_ERROR: 1005,
  RATE_LIMITED: 1006,
  PAYLOAD_TOO_LARGE: 1007,

  // Server errors (5000-5999)
  INTERNAL_ERROR: 5000,
  SERVICE_UNAVAILABLE: 5001,
  DATABASE_ERROR: 5002,
  EXTERNAL_SERVICE_ERROR: 5003,
} as const

export type ResponseCodeType = (typeof ResponseCode)[keyof typeof ResponseCode]

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
```

## Response Helpers

### Helper Functions

```typescript
import type { ResponseCodeType } from './response.code'
import type { ApiResponse, PaginatedResponse, PaginationMeta, ResponseMeta } from './response.type'
// server/core/response/response.helper.ts
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

  return NextResponse.json(response, { status: 200 })
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

  return NextResponse.json(response, { status: 200 })
}

/**
 * Create a failure response
 */
export function fail(
  code: ResponseCodeType,
  message?: string,
  data?: unknown
): NextResponse<ApiResponse<unknown>> {
  const response: ApiResponse<unknown> = {
    code,
    message: message ?? ResponseMessage[code] ?? 'Unknown error',
    data: data ?? null,
  }

  const httpStatus = CodeToHttpStatus[code] ?? 500

  return NextResponse.json(response, { status: httpStatus })
}

/**
 * Create a failure response with custom HTTP status
 */
export function failWithStatus(
  code: ResponseCodeType,
  httpStatus: number,
  message?: string,
  data?: unknown
): NextResponse<ApiResponse<unknown>> {
  const response: ApiResponse<unknown> = {
    code,
    message: message ?? ResponseMessage[code] ?? 'Unknown error',
    data: data ?? null,
  }

  return NextResponse.json(response, { status: httpStatus })
}

/**
 * Create a paginated response
 */
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  const response: PaginatedResponse<T> = {
    code: ResponseCode.SUCCESS,
    message: message ?? ResponseMessage[ResponseCode.SUCCESS],
    data,
    pagination,
  }

  return NextResponse.json(response, { status: 200 })
}

/**
 * Calculate pagination metadata from query params
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Convenience shortcuts
 */
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
```

## Request Context

### AsyncLocalStorage Context

```typescript
// server/core/context/request.context.ts
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
  fn: () => T
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
```

## Request Logger Middleware

### Request Logging

```typescript
import type { RequestContext } from '../context/request.context'
// server/core/middleware/request-logger.middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  createRequestContext,
  getRequestContext,

  runWithRequestContext,
  updateRequestContext
} from '../context/request.context'

/**
 * Request log entry
 */
export interface RequestLogEntry {
  requestId: string
  traceId?: string
  method: string
  path: string
  query?: Record<string, string>
  userAgent?: string
  ip?: string
  userId?: number
  duration: number
  status: number
  timestamp: string
}

/**
 * Logger interface (implement with your preferred logging library)
 */
export interface RequestLogger {
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
}

/**
 * Default console logger
 */
export const consoleLogger: RequestLogger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
}

let logger: RequestLogger = consoleLogger

/**
 * Set custom logger
 */
export function setRequestLogger(customLogger: RequestLogger): void {
  logger = customLogger
}

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

/**
 * Request logger middleware wrapper
 *
 * Wraps a route handler to add request logging and context
 */
export function withRequestLogger<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
): (request: NextRequest, context?: T) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext?: T): Promise<NextResponse> => {
    // Extract trace ID from headers (OpenTelemetry compatible)
    const traceId
      = request.headers.get('x-trace-id')
        ?? request.headers.get('traceparent')?.split('-')[1]
        ?? undefined

    const requestContext = createRequestContext(traceId)

    // Add request metadata to context
    requestContext.userAgent = request.headers.get('user-agent') ?? undefined
    requestContext.ip = getClientIp(request)

    return runWithRequestContext(requestContext, async () => {
      const ctx = getRequestContext()!

      // Log request start
      logger.info('Request started', {
        requestId: ctx.requestId,
        traceId: ctx.traceId,
        method: request.method,
        path: request.nextUrl.pathname,
      })

      try {
        const response = await handler(request, routeContext)
        const duration = Date.now() - ctx.startTime

        // Log request completion
        const logEntry: RequestLogEntry = {
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          method: request.method,
          path: request.nextUrl.pathname,
          userAgent: ctx.userAgent,
          ip: ctx.ip,
          userId: ctx.userId,
          duration,
          status: response.status,
          timestamp: new Date().toISOString(),
        }

        logger.info('Request completed', logEntry as unknown as Record<string, unknown>)

        // Add request ID to response headers
        response.headers.set('x-request-id', ctx.requestId)
        if (ctx.traceId) {
          response.headers.set('x-trace-id', ctx.traceId)
        }

        return response
      }
      catch (error) {
        const duration = Date.now() - ctx.startTime

        logger.error('Request failed', {
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          method: request.method,
          path: request.nextUrl.pathname,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        throw error
      }
    })
  }
}
```

## Audit Logger Middleware

### Audit Logging (Non-GET Requests)

```typescript
// server/core/middleware/audit-logger.middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '../context/request.context'

/**
 * Audit log action types
 */
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

/**
 * Audit log entry for database
 */
export interface AuditLogEntry {
  userId: number
  action: AuditActionType
  entityType: string
  entityId?: number
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  ip?: string
  userAgent?: string
  requestId?: string
  createdAt: Date
}

/**
 * Audit logger interface
 */
export interface AuditLogger {
  log: (entry: AuditLogEntry) => Promise<void>
}

let auditLogger: AuditLogger | null = null

/**
 * Set audit logger implementation
 */
export function setAuditLogger(logger: AuditLogger): void {
  auditLogger = logger
}

/**
 * Log an audit event
 */
export async function logAudit(
  action: AuditActionType,
  entityType: string,
  options?: {
    entityId?: number
    beforeData?: Record<string, unknown>
    afterData?: Record<string, unknown>
    userId?: number
  }
): Promise<void> {
  if (!auditLogger) {
    console.warn('Audit logger not configured')
    return
  }

  const ctx = getRequestContext()

  const entry: AuditLogEntry = {
    userId: options?.userId ?? ctx?.userId ?? 0,
    action,
    entityType,
    entityId: options?.entityId,
    beforeData: options?.beforeData,
    afterData: options?.afterData,
    ip: ctx?.ip,
    userAgent: ctx?.userAgent,
    requestId: ctx?.requestId,
    createdAt: new Date(),
  }

  await auditLogger.log(entry)
}

/**
 * HTTP method to audit action mapping
 */
function methodToAction(method: string): AuditActionType | null {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditAction.CREATE
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE
    case 'DELETE':
      return AuditAction.DELETE
    default:
      return null
  }
}

/**
 * Extract entity type from path
 * e.g., /api/admin/users/123 -> users
 */
function extractEntityType(path: string): string {
  const segments = path.split('/').filter(Boolean)
  // Find the resource name (usually after 'api' and optional 'admin')
  const apiIndex = segments.indexOf('api')
  if (apiIndex >= 0 && segments.length > apiIndex + 1) {
    // Skip 'admin' if present
    const nextIndex = segments[apiIndex + 1] === 'admin' ? apiIndex + 2 : apiIndex + 1
    if (segments.length > nextIndex) {
      return segments[nextIndex]
    }
  }
  return 'unknown'
}

/**
 * Extract entity ID from path
 * e.g., /api/admin/users/123 -> 123
 */
function extractEntityId(path: string): number | undefined {
  const segments = path.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  const id = Number.parseInt(lastSegment, 10)
  return isNaN(id) ? undefined : id
}

/**
 * Audit logger middleware wrapper
 *
 * Automatically logs non-GET requests to audit log
 * Skips GET, HEAD, OPTIONS requests
 */
export function withAuditLogger<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
): (request: NextRequest, context?: T) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext?: T): Promise<NextResponse> => {
    const method = request.method.toUpperCase()

    // Skip GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request, routeContext)
    }

    const action = methodToAction(method)
    if (!action) {
      return handler(request, routeContext)
    }

    const entityType = extractEntityType(request.nextUrl.pathname)
    const entityId = extractEntityId(request.nextUrl.pathname)

    // For updates/deletes, we might want to capture before data
    // This would require fetching the entity first
    // Implementation depends on your data access layer

    const response = await handler(request, routeContext)

    // Only log if request was successful (2xx status)
    if (response.status >= 200 && response.status < 300) {
      try {
        // Try to get the response data for afterData
        const clonedResponse = response.clone()
        const responseData = await clonedResponse.json().catch(() => null)

        await logAudit(action, entityType, {
          entityId,
          afterData: responseData?.data as Record<string, unknown> | undefined,
        })
      }
      catch {
        // Log audit without response data if parsing fails
        await logAudit(action, entityType, { entityId })
      }
    }

    return response
  }
}

/**
 * Combined middleware: request logger + audit logger
 */
export function withLogging<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
): (request: NextRequest, context?: T) => Promise<NextResponse> {
  // Import dynamically to avoid circular dependency
  const { withRequestLogger } = require('./request-logger.middleware')
  return withRequestLogger(withAuditLogger(handler))
}
```

## Database Schemas

### Audit Logs Schema

```typescript
// server/infrastructure/database/schema/audit-log.schema.ts
import { index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

/**
 * Audit logs table - tracks all non-GET API operations
 */
export const auditLogs = pgTable('audit_logs', {
  // Auto-increment ID
  id: serial('id').primaryKey(),
  // Operator user ID
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  // Action type: create, update, delete, login, logout, export, import
  action: varchar('action', { length: 50 }).notNull(),
  // Entity type (table/resource name): users, roles, permissions, etc.
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  // Entity ID (optional, for specific record operations)
  entityId: integer('entity_id'),
  // Data before change (JSON)
  beforeData: jsonb('before_data'),
  // Data after change (JSON)
  afterData: jsonb('after_data'),
  // Client IP address
  ip: varchar('ip', { length: 45 }),
  // User agent string
  userAgent: text('user_agent'),
  // Request ID for correlation
  requestId: varchar('request_id', { length: 36 }),
  // Created time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ([
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_entity_type_idx').on(table.entityType),
  index('audit_logs_entity_id_idx').on(table.entityId),
  index('audit_logs_created_at_idx').on(table.createdAt),
  index('audit_logs_request_id_idx').on(table.requestId),
]))
```

### Login Logs Schema

```typescript
// server/infrastructure/database/schema/login-log.schema.ts
import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export type LoginLog = typeof loginLogs.$inferSelect
export type NewLoginLog = typeof loginLogs.$inferInsert

/**
 * Login status constants
 */
export const LoginStatus = {
  SUCCESS: 1,
  FAILED: 2,
  LOCKED: 3,
} as const

/**
 * Login logs table - tracks all authentication attempts
 */
export const loginLogs = pgTable('login_logs', {
  // Auto-increment ID
  id: serial('id').primaryKey(),
  // User ID (nullable for failed attempts with unknown user)
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Username attempted
  username: varchar('username', { length: 255 }).notNull(),
  // Login status: 1=success, 2=failed, 3=locked
  status: integer('status').notNull(),
  // Failure reason (for failed attempts)
  failureReason: varchar('failure_reason', { length: 255 }),
  // Client IP address
  ip: varchar('ip', { length: 45 }),
  // User agent string
  userAgent: text('user_agent'),
  // Geolocation (optional, if using IP geolocation service)
  location: varchar('location', { length: 255 }),
  // Login time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ([
  index('login_logs_user_id_idx').on(table.userId),
  index('login_logs_username_idx').on(table.username),
  index('login_logs_status_idx').on(table.status),
  index('login_logs_ip_idx').on(table.ip),
  index('login_logs_created_at_idx').on(table.createdAt),
]))
```

### Schema Relations

```typescript
// server/infrastructure/database/schema/relations.ts (append to existing)
import { relations } from 'drizzle-orm'
import { auditLogs } from './audit-log.schema'
import { loginLogs } from './login-log.schema'
import { users } from './user.schema'

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

export const loginLogsRelations = relations(loginLogs, ({ one }) => ({
  user: one(users, {
    fields: [loginLogs.userId],
    references: [users.id],
  }),
}))
```

## Audit Logger Repository

```typescript
import type { AuditLogEntry } from '~/server/core/middleware/audit-logger.middleware'
import type { AuditLog, NewAuditLog } from '~/server/infrastructure/database/schema'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { setAuditLogger } from '~/server/core/middleware/audit-logger.middleware'
// server/infrastructure/logging/audit-log.repository.ts
import { db } from '~/server/infrastructure/database'
import { auditLogs } from '~/server/infrastructure/database/schema'

export class AuditLogRepository {
  async create(data: NewAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(data).returning()
    return result[0]
  }

  async findById(id: number): Promise<AuditLog | null> {
    const result = await db.select().from(auditLogs).where(eq(auditLogs.id, id))
    return result[0] ?? null
  }

  async findByUserId(userId: number, limit = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
  }

  async findByEntityType(entityType: string, limit = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityType, entityType))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
  }

  async findByDateRange(startDate: Date, endDate: Date, limit = 1000): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(
        and(
          gte(auditLogs.createdAt, startDate),
          lte(auditLogs.createdAt, endDate)
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
  }

  async countByAction(action: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.action, action))
    return result[0]?.count ?? 0
  }
}

/**
 * Initialize audit logger with repository
 */
export function initializeAuditLogger(): void {
  const repository = new AuditLogRepository()

  setAuditLogger({
    async log(entry: AuditLogEntry): Promise<void> {
      await repository.create({
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeData: entry.beforeData,
        afterData: entry.afterData,
        ip: entry.ip,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
        createdAt: entry.createdAt,
      })
    },
  })
}
```

## Login Log Repository

```typescript
import type { LoginLog, NewLoginLog } from '~/server/infrastructure/database/schema'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { getRequestContext } from '~/server/core/context/request.context'
// server/infrastructure/logging/login-log.repository.ts
import { db } from '~/server/infrastructure/database'
import { loginLogs, LoginStatus } from '~/server/infrastructure/database/schema'

export class LoginLogRepository {
  async create(data: NewLoginLog): Promise<LoginLog> {
    const result = await db.insert(loginLogs).values(data).returning()
    return result[0]
  }

  async logSuccess(userId: number, username: string): Promise<LoginLog> {
    const ctx = getRequestContext()
    return this.create({
      userId,
      username,
      status: LoginStatus.SUCCESS,
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    })
  }

  async logFailure(username: string, reason: string, userId?: number): Promise<LoginLog> {
    const ctx = getRequestContext()
    return this.create({
      userId: userId ?? null,
      username,
      status: LoginStatus.FAILED,
      failureReason: reason,
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    })
  }

  async logLocked(username: string, userId?: number): Promise<LoginLog> {
    const ctx = getRequestContext()
    return this.create({
      userId: userId ?? null,
      username,
      status: LoginStatus.LOCKED,
      failureReason: 'Account locked due to too many failed attempts',
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    })
  }

  async findByUserId(userId: number, limit = 100): Promise<LoginLog[]> {
    return db
      .select()
      .from(loginLogs)
      .where(eq(loginLogs.userId, userId))
      .orderBy(desc(loginLogs.createdAt))
      .limit(limit)
  }

  async findRecentFailedAttempts(username: string, minutes = 30): Promise<LoginLog[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    return db
      .select()
      .from(loginLogs)
      .where(
        and(
          eq(loginLogs.username, username),
          eq(loginLogs.status, LoginStatus.FAILED),
          gte(loginLogs.createdAt, since)
        )
      )
      .orderBy(desc(loginLogs.createdAt))
  }

  async countFailedAttempts(username: string, minutes = 30): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginLogs)
      .where(
        and(
          eq(loginLogs.username, username),
          eq(loginLogs.status, LoginStatus.FAILED),
          gte(loginLogs.createdAt, since)
        )
      )
    return result[0]?.count ?? 0
  }
}
```

## Usage Examples

### Basic API Handler with Response Helpers

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { withLogging } from '~/server/core/middleware/audit-logger.middleware'
import { badRequest, calculatePagination, notFound, paginated, success } from '~/server/core/response/response.helper'
import { UserRepository } from '~/server/infrastructure/rbac/user.repository'

const userRepository = new UserRepository()

export const GET = withLogging(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)

  const { data, total } = await userRepository.findPaginated(page, pageSize)
  const pagination = calculatePagination(total, page, pageSize)

  return paginated(data, pagination)
})

export const POST = withLogging(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.email) {
    return badRequest('Email is required')
  }

  const user = await userRepository.create(body)
  return success(user, 'Created successfully')
})

// app/api/admin/users/[id]/route.ts
export const GET = withLogging(async (request: NextRequest, { params }) => {
  const user = await userRepository.findById(params.id)

  if (!user) {
    return notFound('User not found')
  }

  return success(user)
})
```

### Login Handler with Audit Logging

```typescript
import { AuditAction, logAudit } from '~/server/core/middleware/audit-logger.middleware'
// server/application/auth/login.usecase.ts
import { LoginLogRepository } from '~/server/infrastructure/logging/login-log.repository'

const loginLogRepository = new LoginLogRepository()

export class LoginUseCase {
  async execute(username: string, password: string) {
    // Check for too many failed attempts
    const failedCount = await loginLogRepository.countFailedAttempts(username)
    if (failedCount >= 5) {
      await loginLogRepository.logLocked(username)
      throw new Error('Account locked due to too many failed attempts')
    }

    // Validate credentials
    const user = await this.validateCredentials(username, password)

    if (!user) {
      await loginLogRepository.logFailure(username, 'Invalid credentials')
      throw new Error('Invalid username or password')
    }

    // Log successful login
    await loginLogRepository.logSuccess(user.id, username)

    // Also log to audit log
    await logAudit(AuditAction.LOGIN, 'auth', {
      userId: user.id,
    })

    return user
  }

  private async validateCredentials(username: string, password: string) {
    // Implementation
  }
}
```

### Initialization in App Entry

```typescript
import { setRequestLogger } from '~/server/core/middleware/request-logger.middleware'
// server/infrastructure/bootstrap.ts
import { initializeAuditLogger } from './logging/audit-log.repository'

/**
 * Initialize server-side infrastructure
 * Call this in your app's initialization
 */
export function initializeServer(): void {
  // Initialize audit logger with database
  initializeAuditLogger()

  // Optionally set up custom request logger (e.g., pino, winston)
  // setRequestLogger(customLogger)
}
```

## File Structure Summary

```
server/core/
├─ response/
│  ├─ response.type.ts      # ApiResponse, PaginatedResponse types
│  ├─ response.code.ts      # ResponseCode constants, messages
│  └─ response.helper.ts    # success(), fail(), paginated() helpers
├─ middleware/
│  ├─ request-logger.middleware.ts  # Request logging with context
│  └─ audit-logger.middleware.ts    # Non-GET audit logging
└─ context/
   └─ request.context.ts    # AsyncLocalStorage for requestId, traceId

server/infrastructure/
├─ database/schema/
│  ├─ audit-log.schema.ts   # Audit logs table
│  └─ login-log.schema.ts   # Login logs table
└─ logging/
   ├─ audit-log.repository.ts   # Audit log CRUD
   └─ login-log.repository.ts   # Login log CRUD
```

## Implementation Checklist

When implementing API response and logging:

1. **Response System**
   - [ ] Create response type definitions
   - [ ] Create response code constants
   - [ ] Create response helper functions
   - [ ] Integrate with existing API handlers

2. **Request Logging**
   - [ ] Create request context with AsyncLocalStorage
   - [ ] Create request logger middleware
   - [ ] Apply middleware to API routes
   - [ ] Configure custom logger (optional)

3. **Audit Logging**
   - [ ] Create audit log database schema
   - [ ] Run database migration
   - [ ] Create audit log repository
   - [ ] Create audit logger middleware
   - [ ] Initialize audit logger in app bootstrap

4. **Login Logging**
   - [ ] Create login log database schema
   - [ ] Run database migration
   - [ ] Create login log repository
   - [ ] Integrate with authentication flow
