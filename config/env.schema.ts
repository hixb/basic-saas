import { z } from 'zod'

/**
 * Runtime environment variable schema.
 */
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:4325'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),
  R2_PUBLIC_BASE_URL: z.string().url('R2_PUBLIC_BASE_URL must be a valid URL'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_UPLOAD_PREFIX: z.string().min(1).default('test'),
})

/**
 * Validated runtime environment variables.
 */
export type Env = z.infer<typeof envSchema>
