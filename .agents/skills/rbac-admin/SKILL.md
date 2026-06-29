---
name: rbac-admin
description: RBAC admin system implementation guide. Use when creating user management, role management, or permission management features with resource:action permission model.
user-invocable: false
---

# RBAC Admin System Specification

Role-Based Access Control (RBAC) implementation guide for the SaaS template.

## Permission Model

### Permission Types (Tree Structure)

Permissions use a tree structure for unified management of menus, buttons, and settings:

| Type | Value | Description |
|------|-------|-------------|
| Menu | 1 | Navigation menu items |
| Button | 2 | Function buttons (actions) |
| Settings | 3 | System settings |

### Permission Identifier (slug)

Permissions use a `slug` format for identification:

```
# Menu examples
dashboard
user-management
role-management
system-settings

# Button examples (under menus)
user-view
user-add
user-edit
user-delete

# Settings examples
system-config
email-settings
```

### API Route Format

API routes are stored in JSON format:

```json
[
  { "method": "GET", "url": "/api/admin/users" },
  { "method": "POST", "url": "/api/admin/users" }
]
```

### User-Role Relationship: One-to-Many

- One user can have only ONE role
- User table has direct `role_id` foreign key
- One role can be assigned to MANY users

## Database Schema (Drizzle)

### Schema Location

```
server/infrastructure/database/schema/
├─ user.schema.ts
├─ role.schema.ts
├─ permission.schema.ts
├─ role-permission.schema.ts
└─ relations.ts
```

### Users Table

```typescript
// server/infrastructure/database/schema/user.schema.ts
import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { roles } from './role.schema'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

/**
 * Admin users
 */
export const users = pgTable('users', {
  // Auto-increment ID
  id: serial('id').primaryKey(),
  // Username
  username: varchar('username', { length: 255 }).notNull().unique(),
  // Email
  email: varchar('email', { length: 255 }).notNull().unique(),
  // Nickname
  nickname: varchar('nickname', { length: 100 }).notNull(),
  // Password
  password: text('password').notNull(),
  // Avatar
  avatar: varchar('avatar', { length: 255 }),
  // RBAC: Role ID (one-to-one relationship)
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  // User status: 1=active 2=disabled
  status: integer('status').notNull().default(1),
  // Created time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // Updated time
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('users_role_id_idx').on(table.roleId),
  index('users_status_idx').on(table.status),
  index('users_email_idx').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
]))
```

### Roles Table

```typescript
// server/infrastructure/database/schema/role.schema.ts
import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

/**
 * Roles table
 */
export const roles = pgTable('roles', {
  // Auto-increment ID
  id: serial('id').primaryKey(),
  // Role name (unique identifier)
  name: varchar('name', { length: 100 }).notNull().unique(),
  // Role description
  description: text('description'),
  // Status: 1=active 2=disabled
  status: integer('status').notNull().default(1),
  // Created time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // Updated time
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('roles_name_idx').on(table.name),
  index('roles_status_idx').on(table.status),
  index('roles_created_at_idx').on(table.createdAt),
]))
```

### Permissions Table (Tree Structure)

```typescript
// server/infrastructure/database/schema/permission.schema.ts
import { index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

/**
 * Permissions table (tree structure for unified management of menus, buttons, settings)
 */
export const permissions = pgTable('permissions', {
  // Auto-increment ID
  id: serial('id').primaryKey(),
  // Permission type: 1=menu 2=function button 3=settings
  type: integer('type').notNull(),
  // Permission identifier (unique, e.g.: user-view, user-add, system-setting)
  slug: varchar('slug', { length: 255 }).notNull().default(''),
  // Display name
  name: varchar('name', { length: 50 }).notNull(),
  // Parent permission ID (0 means root node)
  parentId: integer('parent_id').notNull().default(0),
  // Icon name (e.g.: user, setting, dashboard)
  icon: varchar('icon', { length: 50 }).default(''),
  // Frontend route path
  url: varchar('url', { length: 255 }).default(''),
  // API routes (JSON format: [{"method":"GET","url":"/api/user/*"}])
  api: varchar('api', { length: 255 }).default(''),
  // Sort value
  sort: integer('sort').notNull().default(0),
  // Created time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // Updated time
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('permissions_parent_id_idx').on(table.parentId),
  index('permissions_sort_idx').on(table.sort),
]))
```

### Role-Permissions Junction Table

```typescript
// server/infrastructure/database/schema/role-permission.schema.ts
import { index, integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'
import { permissions } from './permission.schema'
import { roles } from './role.schema'

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

/**
 * Role-permission association table
 */
export const rolePermissions = pgTable('role_permissions', {
  // Role ID
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  // Permission ID
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, table => ([
  index('role_permissions_role_id_idx').on(table.roleId),
  index('role_permissions_permission_id_idx').on(table.permissionId),
  // Composite unique index ensures uniqueness
  uniqueIndex('role_permissions_pk').on(table.permissionId, table.roleId),
]))
```

### Relations

```typescript
// server/infrastructure/database/schema/relations.ts
import { relations } from 'drizzle-orm'
import { permissions } from './permission.schema'
import { rolePermissions } from './role-permission.schema'
import { roles } from './role.schema'
import { users } from './user.schema'

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))
```

## Backend Architecture

Following the engineering-architecture skill layered structure.

### Directory Structure

```
server/
├─ domain/
│  └─ rbac/
│     ├─ user.entity.ts
│     ├─ role.entity.ts
│     ├─ permission.entity.ts
│     └─ errors/
│        ├─ user-not-found.error.ts
│        ├─ role-not-found.error.ts
│        ├─ permission-not-found.error.ts
│        └─ forbidden.error.ts
├─ application/
│  └─ rbac/
│     ├─ user/
│     │  ├─ create-user.usecase.ts
│     │  ├─ update-user.usecase.ts
│     │  ├─ delete-user.usecase.ts
│     │  ├─ get-user.usecase.ts
│     │  └─ list-users.usecase.ts
│     ├─ role/
│     │  ├─ create-role.usecase.ts
│     │  ├─ update-role.usecase.ts
│     │  ├─ delete-role.usecase.ts
│     │  ├─ get-role.usecase.ts
│     │  ├─ list-roles.usecase.ts
│     │  └─ assign-permissions.usecase.ts
│     └─ permission/
│        ├─ create-permission.usecase.ts
│        ├─ update-permission.usecase.ts
│        ├─ delete-permission.usecase.ts
│        ├─ get-permission.usecase.ts
│        └─ list-permissions.usecase.ts
├─ infrastructure/
│  └─ rbac/
│     ├─ user.repository.ts
│     ├─ role.repository.ts
│     └─ permission.repository.ts
└─ interfaces/
   └─ http/
      └─ rbac/
         ├─ user.handler.ts
         ├─ role.handler.ts
         └─ permission.handler.ts
```

### Domain Layer

```typescript
// server/domain/rbac/user.entity.ts
export interface UserEntity {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string | null
  status: number // 1=active, 2=disabled
  roleId: number
  createdAt: Date
  updatedAt: Date
}

// User status constants
export const UserStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

export function isUserActive(user: UserEntity): boolean {
  return user.status === UserStatus.ACTIVE
}

// server/domain/rbac/role.entity.ts
export interface RoleEntity {
  id: number
  name: string
  description: string | null
  status: number // 1=active, 2=disabled
  permissions: PermissionEntity[]
  createdAt: Date
  updatedAt: Date
}

// Role status constants
export const RoleStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

export function isRoleActive(role: RoleEntity): boolean {
  return role.status === RoleStatus.ACTIVE
}

// server/domain/rbac/permission.entity.ts
export interface PermissionEntity {
  id: number
  type: number // 1=menu, 2=button, 3=settings
  slug: string // Permission identifier
  name: string // Display name
  parentId: number // 0 = root node
  icon: string | null
  url: string | null
  api: string | null // JSON format for API routes
  sort: number
  createdAt: Date
  updatedAt: Date
  children?: PermissionEntity[] // For tree structure
}

// Permission type constants
export const PermissionType = {
  MENU: 1,
  BUTTON: 2,
  SETTINGS: 3,
} as const

// API route interface
export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
}

// Permission utilities
export function parseApiRoutes(api: string | null): ApiRoute[] {
  if (!api)
    return []
  try {
    return JSON.parse(api) as ApiRoute[]
  }
  catch {
    return []
  }
}

export function stringifyApiRoutes(routes: ApiRoute[]): string {
  return JSON.stringify(routes)
}

export function isMenuPermission(permission: PermissionEntity): boolean {
  return permission.type === PermissionType.MENU
}

export function isButtonPermission(permission: PermissionEntity): boolean {
  return permission.type === PermissionType.BUTTON
}

export function isSettingsPermission(permission: PermissionEntity): boolean {
  return permission.type === PermissionType.SETTINGS
}

// Build permission tree from flat list
export function buildPermissionTree(permissions: PermissionEntity[]): PermissionEntity[] {
  const map = new Map<number, PermissionEntity>()
  const roots: PermissionEntity[] = []

  // Create map of all permissions
  permissions.forEach((p) => {
    map.set(p.id, { ...p, children: [] })
  })

  // Build tree structure
  permissions.forEach((p) => {
    const node = map.get(p.id)!
    if (p.parentId === 0) {
      roots.push(node)
    }
    else {
      const parent = map.get(p.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  })

  // Sort by sort field
  const sortNodes = (nodes: PermissionEntity[]): PermissionEntity[] => {
    return nodes
      .sort((a, b) => a.sort - b.sort)
      .map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
  }

  return sortNodes(roots)
}
```

### Application Layer (Use Cases)

```typescript
import type { NewUser, User } from '~/server/infrastructure/database/schema'
// server/application/rbac/user/create-user.usecase.ts
import type { UserRepository } from '~/server/infrastructure/rbac/user.repository'

export interface CreateUserInput {
  email: string
  name?: string
  password?: string
  roleId?: string
}

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) {
      throw new ConflictError('User with this email already exists')
    }

    // Create user
    return this.userRepository.create(input)
  }
}
```

### Infrastructure Layer (Repository)

```typescript
import type { NewUser, User } from '~/server/infrastructure/database/schema'
// server/infrastructure/rbac/user.repository.ts
import { eq } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { users } from '~/server/infrastructure/database/schema'

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id))
    return result[0] ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email))
    return result[0] ?? null
  }

  async findAll(): Promise<User[]> {
    return db.select().from(users)
  }

  async create(data: NewUser): Promise<User> {
    const result = await db.insert(users).values(data).returning()
    return result[0]
  }

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return result[0]
  }

  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id))
  }
}
```

### Interfaces Layer (HTTP Handler)

```typescript
// server/interfaces/http/rbac/user.handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { CreateUserUseCase } from '~/server/application/rbac/user/create-user.usecase'
import { UserRepository } from '~/server/infrastructure/rbac/user.repository'
import { createUserSchema } from '~/shared/schemas/rbac/user.schema'

const userRepository = new UserRepository()

export async function handleGetUsers() {
  const users = await userRepository.findAll()
  return NextResponse.json({ success: true, data: users })
}

export async function handleCreateUser(request: NextRequest) {
  const body = await request.json()
  const validated = createUserSchema.parse(body)

  const usecase = new CreateUserUseCase(userRepository)
  const user = await usecase.execute(validated)

  return NextResponse.json({ success: true, data: user }, { status: 201 })
}

export async function handleGetUser(id: string) {
  const user = await userRepository.findById(id)
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    )
  }
  return NextResponse.json({ success: true, data: user })
}

export async function handleUpdateUser(id: string, request: NextRequest) {
  const body = await request.json()
  const user = await userRepository.update(id, body)
  return NextResponse.json({ success: true, data: user })
}

export async function handleDeleteUser(id: string) {
  await userRepository.delete(id)
  return NextResponse.json({ success: true, data: null }, { status: 200 })
}
```

## API Routes

### Route Structure

```
app/api/admin/
├─ users/
│  ├─ route.ts           # GET (list), POST (create)
│  └─ [id]/
│     └─ route.ts        # GET, PUT, DELETE
├─ roles/
│  ├─ route.ts           # GET (list), POST (create)
│  └─ [id]/
│     ├─ route.ts        # GET, PUT, DELETE
│     └─ permissions/
│        └─ route.ts     # PUT (assign permissions)
└─ permissions/
   ├─ route.ts           # GET (list), POST (create)
   └─ [id]/
      └─ route.ts        # GET, PUT, DELETE
```

### API Route Implementation

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
// app/api/admin/users/[id]/route.ts
import { NextRequest } from 'next/server'

import { handleCreateUser, handleDeleteUser, handleGetUser, handleGetUsers, handleUpdateUser } from '~/server/interfaces/http/rbac/user.handler'

export async function GET() {
  return handleGetUsers()
}

export async function POST(request: NextRequest) {
  return handleCreateUser(request)
}

interface Params {
  params: { id: string }
}

export async function GET(_: NextRequest, { params }: Params) {
  return handleGetUser(params.id)
}

export async function PUT(request: NextRequest, { params }: Params) {
  return handleUpdateUser(params.id, request)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  return handleDeleteUser(params.id)
}
```

## Shared Schemas

### Schema Location

```
shared/schemas/rbac/
├─ user.schema.ts
├─ role.schema.ts
└─ permission.schema.ts
```

### User Schema

```typescript
// shared/schemas/rbac/user.schema.ts
import { z } from 'zod'

export const UserStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

export const createUserSchema = z.object({
  username: z.string().min(1).max(255),
  email: z.string().email().max(255),
  nickname: z.string().min(1).max(100),
  password: z.string().min(8),
  avatar: z.string().max(255).optional(),
  roleId: z.number().int().positive(),
  status: z.number().int().min(1).max(2).default(UserStatus.ACTIVE),
})

export const updateUserSchema = z.object({
  username: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  nickname: z.string().min(1).max(100).optional(),
  password: z.string().min(8).optional(),
  avatar: z.string().max(255).nullable().optional(),
  roleId: z.number().int().positive().optional(),
  status: z.number().int().min(1).max(2).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
```

### Role Schema

```typescript
// shared/schemas/rbac/role.schema.ts
import { z } from 'zod'

export const RoleStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.number().int().min(1).max(2).default(RoleStatus.ACTIVE),
})

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  status: z.number().int().min(1).max(2).optional(),
})

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>
```

### Permission Schema

```typescript
// shared/schemas/rbac/permission.schema.ts
import { z } from 'zod'

export const PermissionType = {
  MENU: 1,
  BUTTON: 2,
  SETTINGS: 3,
} as const

// API route schema
const apiRouteSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string(),
})

// Validates slug format (lowercase letters, numbers, hyphens)
const slugPattern = /^[a-z0-9-]+$/

export const createPermissionSchema = z.object({
  type: z.number().int().min(1).max(3),
  slug: z.string().regex(slugPattern, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  }),
  name: z.string().min(1).max(50),
  parentId: z.number().int().min(0).default(0),
  icon: z.string().max(50).optional(),
  url: z.string().max(255).optional(),
  api: z.array(apiRouteSchema).optional().transform(v => v ? JSON.stringify(v) : ''),
  sort: z.number().int().min(0).default(0),
})

export const updatePermissionSchema = z.object({
  type: z.number().int().min(1).max(3).optional(),
  slug: z.string().regex(slugPattern).optional(),
  name: z.string().min(1).max(50).optional(),
  parentId: z.number().int().min(0).optional(),
  icon: z.string().max(50).nullable().optional(),
  url: z.string().max(255).nullable().optional(),
  api: z.array(apiRouteSchema).optional().transform(v => v ? JSON.stringify(v) : undefined),
  sort: z.number().int().min(0).optional(),
})

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>
```

## Admin UI Structure

### Page Structure

```
app/[locale]/(authenticated)/admin/
├─ layout.tsx
├─ page.tsx              # Admin dashboard
├─ users/
│  ├─ page.tsx           # User list
│  ├─ [id]/
│  │  └─ page.tsx        # User detail/edit
│  ├─ views/
│  │  ├─ user-list.view.tsx
│  │  └─ user-form.view.tsx
│  ├─ components/
│  │  ├─ user-table.tsx
│  │  └─ user-form.tsx
│  └─ hooks/
│     └─ use-users.hook.ts
├─ roles/
│  ├─ page.tsx           # Role list
│  ├─ [id]/
│  │  └─ page.tsx        # Role detail/edit with permission assignment
│  ├─ views/
│  │  ├─ role-list.view.tsx
│  │  └─ role-form.view.tsx
│  ├─ components/
│  │  ├─ role-table.tsx
│  │  ├─ role-form.tsx
│  │  └─ permission-selector.tsx
│  └─ hooks/
│     └─ use-roles.hook.ts
└─ permissions/
   ├─ page.tsx           # Permission list
   ├─ views/
   │  └─ permission-list.view.tsx
   ├─ components/
   │  └─ permission-table.tsx
   └─ hooks/
      └─ use-permissions.hook.ts
```

### Page Implementation

```typescript
// app/[locale]/(authenticated)/admin/users/page.tsx
import { UserListView } from './views/user-list.view'

export default function UsersPage() {
  return <UserListView />
}

// app/[locale]/(authenticated)/admin/users/views/user-list.view.tsx
'use client'

import { useUsers } from '../hooks/use-users.hook'
import { UserTable } from '../components/user-table'

export function UserListView() {
  const { users, isLoading, error } = useUsers()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Users</h1>
      <UserTable users={users} />
    </div>
  )
}
```

## Permission Checking Utilities

### Backend Permission Check

```typescript
// server/core/guards/permission.guard.ts
import { NextRequest, NextResponse } from 'next/server'
import { RoleStatus, UserStatus } from '~/server/domain/rbac'
import { getSession } from '~/server/infrastructure/auth'
import { RoleRepository } from '~/server/infrastructure/rbac/role.repository'
import { UserRepository } from '~/server/infrastructure/rbac/user.repository'

const roleRepository = new RoleRepository()
const userRepository = new UserRepository()

export async function requirePermission(
  request: NextRequest,
  slug: string // Permission slug, e.g., 'user-add', 'role-edit'
): Promise<NextResponse | null> {
  const session = await getSession(request)
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  // Check if user is active (status: 1=active, 2=disabled)
  const user = await userRepository.findById(session.user.id)
  if (!user || user.status === UserStatus.DISABLED) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'User account is disabled' } },
      { status: 403 }
    )
  }

  // Check if role is active (status: 1=active, 2=disabled)
  const role = await roleRepository.findById(user.roleId)
  if (!role || role.status === RoleStatus.DISABLED) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Role is disabled' } },
      { status: 403 }
    )
  }

  // Check if role has the permission (by slug)
  const hasPermission = await roleRepository.hasPermissionBySlug(user.roleId, slug)
  if (!hasPermission) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    )
  }

  return null // Permission granted
}

// Check API route permission
export async function requireApiPermission(
  request: NextRequest,
  method: string,
  path: string
): Promise<NextResponse | null> {
  const session = await getSession(request)
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  // Find permission that matches this API route
  const hasAccess = await roleRepository.hasApiPermission(
    session.user.roleId,
    method,
    path
  )

  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    )
  }

  return null
}

// Usage in route handler
export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, 'user-add')
  if (forbidden)
    return forbidden

  // Handle request...
}
```

### Frontend Permission Hook

```typescript
// hooks/use-permission.hook.ts
'use client'

import { useSession } from '~/hooks/use-session.hook'
import { useMemo } from 'react'
import type { PermissionEntity } from '~/server/domain/rbac/permission.entity'

export function usePermission() {
  const { session, isLoading } = useSession()

  // Flat list of permission slugs
  const permissionSlugs = useMemo(() => {
    return session?.user?.permissions?.map(p => p.slug) ?? []
  }, [session])

  // Full permission objects (for menu building)
  const permissions = useMemo(() => {
    return session?.user?.permissions ?? []
  }, [session])

  // Check by slug
  const hasPermission = (slug: string): boolean => {
    return permissionSlugs.includes(slug)
  }

  const hasAnyPermission = (slugs: string[]): boolean => {
    return slugs.some((s) => permissionSlugs.includes(s))
  }

  const hasAllPermissions = (slugs: string[]): boolean => {
    return slugs.every((s) => permissionSlugs.includes(s))
  }

  // Get menu permissions (type = 1)
  const menuPermissions = useMemo(() => {
    return permissions.filter(p => p.type === 1)
  }, [permissions])

  // Get button permissions for a parent menu
  const getButtonPermissions = (parentSlug: string): PermissionEntity[] => {
    const parent = permissions.find(p => p.slug === parentSlug)
    if (!parent) return []
    return permissions.filter(p => p.parentId === parent.id && p.type === 2)
  }

  return {
    permissions,
    permissionSlugs,
    menuPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getButtonPermissions,
    isLoading,
  }
}

// Usage
function AdminButton() {
  const { hasPermission } = usePermission()

  if (!hasPermission('user-add')) {
    return null
  }

  return <button>Create User</button>
}

// Build sidebar menu from permissions
function Sidebar() {
  const { menuPermissions } = usePermission()

  return (
    <nav>
      {menuPermissions.map(menu => (
        <Link key={menu.id} href={menu.url || '#'}>
          <Icon name={menu.icon} />
          {menu.name}
        </Link>
      ))}
    </nav>
  )
}
```

### Permission-Based Component Wrapper

```typescript
// components/permission-gate.tsx
'use client'

import { usePermission } from '~/hooks/use-permission.hook'
import type { ReactNode } from 'react'

interface PermissionGateProps {
  slug: string | string[] // Permission slug(s)
  mode?: 'any' | 'all'
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  slug,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission()

  if (isLoading) return null

  const slugs = Array.isArray(slug) ? slug : [slug]
  const hasAccess =
    mode === 'all' ? hasAllPermissions(slugs) : hasAnyPermission(slugs)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Usage
<PermissionGate slug="user-delete">
  <DeleteButton />
</PermissionGate>

<PermissionGate slug={['user-edit', 'user-delete']} mode="any">
  <ActionMenu />
</PermissionGate>
```

## Default Permissions

Seed data for initial permissions (tree structure):

```typescript
// server/infrastructure/database/seed/permissions.seed.ts
import { PermissionType } from '../schema/permission.schema'

// Default permissions with tree structure
export const defaultPermissions = [
  // Dashboard menu (root)
  {
    id: 1,
    type: PermissionType.MENU,
    slug: 'dashboard',
    name: 'Dashboard',
    parentId: 0,
    icon: 'dashboard',
    url: '/admin',
    api: '',
    sort: 1,
  },

  // User Management menu (root)
  {
    id: 2,
    type: PermissionType.MENU,
    slug: 'user-management',
    name: 'User Management',
    parentId: 0,
    icon: 'users',
    url: '/admin/users',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/users' }]),
    sort: 2,
  },
  // User buttons (children of user-management)
  {
    id: 3,
    type: PermissionType.BUTTON,
    slug: 'user-view',
    name: 'View User',
    parentId: 2,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/users/*' }]),
    sort: 1,
  },
  {
    id: 4,
    type: PermissionType.BUTTON,
    slug: 'user-add',
    name: 'Add User',
    parentId: 2,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'POST', url: '/api/admin/users' }]),
    sort: 2,
  },
  {
    id: 5,
    type: PermissionType.BUTTON,
    slug: 'user-edit',
    name: 'Edit User',
    parentId: 2,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'PUT', url: '/api/admin/users/*' }]),
    sort: 3,
  },
  {
    id: 6,
    type: PermissionType.BUTTON,
    slug: 'user-delete',
    name: 'Delete User',
    parentId: 2,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'DELETE', url: '/api/admin/users/*' }]),
    sort: 4,
  },

  // Role Management menu (root)
  {
    id: 7,
    type: PermissionType.MENU,
    slug: 'role-management',
    name: 'Role Management',
    parentId: 0,
    icon: 'shield',
    url: '/admin/roles',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/roles' }]),
    sort: 3,
  },
  // Role buttons
  {
    id: 8,
    type: PermissionType.BUTTON,
    slug: 'role-view',
    name: 'View Role',
    parentId: 7,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/roles/*' }]),
    sort: 1,
  },
  {
    id: 9,
    type: PermissionType.BUTTON,
    slug: 'role-add',
    name: 'Add Role',
    parentId: 7,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'POST', url: '/api/admin/roles' }]),
    sort: 2,
  },
  {
    id: 10,
    type: PermissionType.BUTTON,
    slug: 'role-edit',
    name: 'Edit Role',
    parentId: 7,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'PUT', url: '/api/admin/roles/*' }]),
    sort: 3,
  },
  {
    id: 11,
    type: PermissionType.BUTTON,
    slug: 'role-delete',
    name: 'Delete Role',
    parentId: 7,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'DELETE', url: '/api/admin/roles/*' }]),
    sort: 4,
  },

  // Permission Management menu (root)
  {
    id: 12,
    type: PermissionType.MENU,
    slug: 'permission-management',
    name: 'Permission Management',
    parentId: 0,
    icon: 'key',
    url: '/admin/permissions',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/permissions' }]),
    sort: 4,
  },
  // Permission buttons
  {
    id: 13,
    type: PermissionType.BUTTON,
    slug: 'permission-view',
    name: 'View Permission',
    parentId: 12,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'GET', url: '/api/admin/permissions/*' }]),
    sort: 1,
  },
  {
    id: 14,
    type: PermissionType.BUTTON,
    slug: 'permission-add',
    name: 'Add Permission',
    parentId: 12,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'POST', url: '/api/admin/permissions' }]),
    sort: 2,
  },
  {
    id: 15,
    type: PermissionType.BUTTON,
    slug: 'permission-edit',
    name: 'Edit Permission',
    parentId: 12,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'PUT', url: '/api/admin/permissions/*' }]),
    sort: 3,
  },
  {
    id: 16,
    type: PermissionType.BUTTON,
    slug: 'permission-delete',
    name: 'Delete Permission',
    parentId: 12,
    icon: '',
    url: '',
    api: JSON.stringify([{ method: 'DELETE', url: '/api/admin/permissions/*' }]),
    sort: 4,
  },

  // System Settings menu (root)
  {
    id: 17,
    type: PermissionType.MENU,
    slug: 'system-settings',
    name: 'System Settings',
    parentId: 0,
    icon: 'settings',
    url: '/admin/settings',
    api: '',
    sort: 5,
  },
  {
    id: 18,
    type: PermissionType.SETTINGS,
    slug: 'system-config',
    name: 'System Configuration',
    parentId: 17,
    icon: '',
    url: '/admin/settings/system',
    api: JSON.stringify([
      { method: 'GET', url: '/api/admin/settings/system' },
      { method: 'PUT', url: '/api/admin/settings/system' },
    ]),
    sort: 1,
  },
]

// Default roles with status
export const defaultRoles = [
  {
    name: 'admin',
    description: 'Full system access',
    status: 1,
    // Assign all permission IDs
    permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  },
  {
    name: 'manager',
    description: 'User and role management access',
    status: 1,
    // Dashboard + User management (view, add, edit) + Role management (view)
    permissionIds: [1, 2, 3, 4, 5, 7, 8],
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    status: 1,
    // Dashboard + view permissions only
    permissionIds: [1, 2, 3, 7, 8, 12, 13],
  },
]
```

## Implementation Checklist

When implementing RBAC:

1. **Database Setup**
   - [ ] Create Drizzle schema files
   - [ ] Run database migrations
   - [ ] Seed default permissions and roles

2. **Backend**
   - [ ] Implement domain entities
   - [ ] Implement repositories
   - [ ] Implement use cases
   - [ ] Implement HTTP handlers
   - [ ] Create API routes
   - [ ] Add permission guards

3. **Frontend**
   - [ ] Create admin pages
   - [ ] Implement permission hooks
   - [ ] Add permission gates to UI
   - [ ] Connect to API services

4. **Testing**
   - [ ] Unit tests for use cases
   - [ ] Integration tests for repositories
   - [ ] E2E tests for API routes
