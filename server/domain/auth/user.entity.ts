/**
 * User entity representing authenticated users in the system
 */
export interface UserEntity {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string | null
  status: number
  roleId: number
  createdAt: Date
  updatedAt: Date
}

/**
 * User account status values
 */
export const UserStatus = {
  /** Active user account */
  ACTIVE: 1,
  /** Disabled user account */
  DISABLED: 2,
} as const

/**
 * Check if user account is active
 */
export function isUserActive(user: UserEntity): boolean {
  return user.status === UserStatus.ACTIVE
}
