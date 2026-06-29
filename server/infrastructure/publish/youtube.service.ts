import type { PublishPostInput, PublishResult } from '~/server/domain/publish/publish.type'
import type { SocialAccount } from '~/server/infrastructure/database/schema/social-account.schema'

const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable'

/**
 * Publishes video content to YouTube using resumable upload.
 */
export async function publishToYoutube(post: PublishPostInput, account: SocialAccount): Promise<PublishResult> {
  if (!post.videoUrl) {
    return {
      platform: 'youtube',
      accountId: account.id,
      status: 'skipped',
      message: 'YouTube requires a video file',
    }
  }

  const videoResponse = await fetch(post.videoUrl)

  if (!videoResponse.ok) {
    return {
      platform: 'youtube',
      accountId: account.id,
      status: 'failed',
      message: `Video file download failed: ${videoResponse.status}`,
    }
  }

  const initResponse = await fetch(YOUTUBE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': post.videoContentType ?? 'video/mp4',
    },
    body: JSON.stringify({
      snippet: {
        title: post.title,
        description: post.content,
      },
      status: {
        privacyStatus: 'public',
      },
    }),
  })

  if (!initResponse.ok) {
    const detail = await initResponse.text()

    return {
      platform: 'youtube',
      accountId: account.id,
      status: 'failed',
      message: `YouTube upload session failed: ${initResponse.status}`,
      detail,
    }
  }

  const uploadUrl = initResponse.headers.get('Location')

  if (!uploadUrl) {
    return {
      platform: 'youtube',
      accountId: account.id,
      status: 'failed',
      message: 'YouTube upload session did not return a Location URL',
    }
  }

  const videoBody = await videoResponse.arrayBuffer()
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': post.videoContentType ?? 'video/mp4',
    },
    body: videoBody,
  })

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text()

    return {
      platform: 'youtube',
      accountId: account.id,
      status: 'failed',
      message: `YouTube video upload failed: ${uploadResponse.status}`,
      detail,
    }
  }

  const data = await uploadResponse.json() as { id?: string }

  return {
    platform: 'youtube',
    accountId: account.id,
    status: 'published',
    message: 'Published to YouTube',
    remoteId: data.id,
  }
}
