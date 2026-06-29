import type { PublishPostInput, PublishResult } from '~/server/domain/publish/publish.type'
import type { SocialAccount } from '~/server/infrastructure/database/schema/social-account.schema'

const FACEBOOK_GRAPH_BASE_URL = 'https://graph.facebook.com'

/**
 * Publishes link-style content to Facebook feed.
 */
export async function publishToFacebook(post: PublishPostInput, account: SocialAccount): Promise<PublishResult> {
  const pageId = account.platformAccountId

  if (!pageId) {
    return {
      platform: 'facebook',
      accountId: account.id,
      status: 'failed',
      message: 'Facebook page ID is not configured',
    }
  }

  const body = new URLSearchParams({
    message: `${post.title}\n${post.url}`,
    access_token: account.accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE_URL}/${pageId}/feed`, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const detail = await response.text()

    return {
      platform: 'facebook',
      accountId: account.id,
      status: 'failed',
      message: `Facebook publish failed: ${response.status}`,
      detail,
    }
  }

  const data = await response.json() as { id?: string }

  return {
    platform: 'facebook',
    accountId: account.id,
    status: 'published',
    message: 'Published to Facebook',
    remoteId: data.id,
  }
}
