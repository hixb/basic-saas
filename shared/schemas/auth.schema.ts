import { z } from 'zod'

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
})

/**
 * Login request input type
 */
export type LoginInput = z.infer<typeof loginSchema>

/**
 * Login response data
 */
export interface LoginResponse {
  user: {
    id: number
    username: string
    email: string
    nickname: string
    avatar: string | null
    roleId: number
    status: number
  }
  token?: string
}
