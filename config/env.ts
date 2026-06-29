import { envSchema } from './env.schema'

/**
 * Validated environment variables.
 */
export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  ENABLE_BEHAVIOR_ANALYSIS: process.env.ENABLE_BEHAVIOR_ANALYSIS,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_UPLOAD_PREFIX: process.env.R2_UPLOAD_PREFIX,
})
