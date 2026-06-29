import { z } from 'zod'

/**
 * Admin social platform configuration schema.
 */
export const socialPlatformConfigSchema = z.object({
  platform: z.enum(['facebook', 'youtube', 'tiktok']),
  displayName: z.string().min(2, 'Display name is required').max(120),
  clientId: z.string().min(2, 'Client ID is required').max(500),
  clientSecret: z.string().min(2, 'Client secret is required').max(1000),
  authUrl: z.string().url('Auth URL must be valid').max(1000),
  tokenUrl: z.string().url('Token URL must be valid').max(1000),
  apiBaseUrl: z.string().url('API base URL must be valid').max(1000),
  publishEndpoint: z.string().max(1000).optional().or(z.literal('')),
  uploadEndpoint: z.string().max(1000).optional().or(z.literal('')),
  scopes: z.string().max(3000).default(''),
  status: z.coerce.number().int().min(1).max(2).default(1),
})

/**
 * Admin social platform configuration input.
 */
export type SocialPlatformConfigInput = z.infer<typeof socialPlatformConfigSchema>
