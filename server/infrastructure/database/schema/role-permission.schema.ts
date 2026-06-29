import { index, integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'
import { permissions } from './permission.schema'
import { roles } from './role.schema'

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

/**
 * Role to permission association table.
 */
export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, table => ([
  index('role_permissions_role_id_idx').on(table.roleId),
  index('role_permissions_permission_id_idx').on(table.permissionId),
  uniqueIndex('role_permissions_unique_idx').on(table.roleId, table.permissionId),
]))
