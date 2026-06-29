import type { SocialPlatformType } from '~/server/infrastructure/database/schema/social-account.schema'

/**
 * Publishable content shape used by social platform integrations.
 */
export interface PublishPostInput {
  id: number
  title: string
  content: string
  url: string
  videoUrl: string | null
  videoContentType: string | null
}

/**
 * Platform publishing result status.
 */
export type PublishStatus = 'published' | 'skipped' | 'failed'

/**
 * Result returned by each platform publisher.
 */
export interface PublishResult {
  platform: SocialPlatformType
  accountId: number
  status: PublishStatus
  message: string
  remoteId?: string
  detail?: unknown
}
