import type { PublishPostInput, PublishResult } from '~/server/domain/publish/publish.type'
import type { SocialPlatformType } from '~/server/infrastructure/database/schema/social-account.schema'
import { env } from '~/config/env'
import { SocialAccountRepository } from '~/server/infrastructure/database/repositories/social-account.repository'
import { SocialPlatformConfigRepository } from '~/server/infrastructure/database/repositories/social-platform-config.repository'
import { UploadedMaterialRepository } from '~/server/infrastructure/database/repositories/uploaded-material.repository'
import { SocialPlatform } from '~/server/infrastructure/database/schema/social-account.schema'
import { UploadedMaterialStatus } from '~/server/infrastructure/database/schema/uploaded-material.schema'
import { publishToFacebook } from '~/server/infrastructure/publish/facebook.service'
import { publishToYoutube } from '~/server/infrastructure/publish/youtube.service'
import { R2StorageService } from '~/server/infrastructure/storage/r2.service'

const materialRepository = new UploadedMaterialRepository()
const socialAccountRepository = new SocialAccountRepository()
const socialPlatformConfigRepository = new SocialPlatformConfigRepository()
const storage = new R2StorageService()

/**
 * Platforms recommended for a material based on available content assets.
 */
export interface PublishSuitability {
  platform: string
  suitable: boolean
  reason: string
}

function buildMaterialUrl(materialId: number) {
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/g, '')}/details/${materialId}`
}

function getMaterialVideoUrl(material: { fileKey: string | null, fileContentType: string | null }) {
  if (!material.fileKey || !material.fileContentType?.startsWith('video/'))
    return null

  return storage.getPublicUrl(material.fileKey)
}

function isSupportedPlatform(platform: string) {
  return platform === SocialPlatform.FACEBOOK || platform === SocialPlatform.YOUTUBE
}

function toSocialPlatform(platform: string): SocialPlatformType | null {
  return isSupportedPlatform(platform) ? platform as SocialPlatformType : null
}

/**
 * Evaluates which social platforms are suitable for a material.
 */
export function evaluateMaterialPublishSuitability(material: {
  fileKey: string | null
  fileContentType: string | null
}): PublishSuitability[] {
  return [
    {
      platform: SocialPlatform.FACEBOOK,
      suitable: true,
      reason: 'Facebook supports link posts',
    },
    {
      platform: SocialPlatform.YOUTUBE,
      suitable: Boolean(getMaterialVideoUrl(material)),
      reason: getMaterialVideoUrl(material)
        ? 'YouTube supports this video attachment'
        : 'YouTube requires a video attachment',
    },
  ]
}

/**
 * Publishes a material to selected connected social platforms.
 */
export async function publishMaterialToPlatforms(params: {
  materialId: number
  userId: number
  platforms?: string[]
}): Promise<{ results: PublishResult[], suitability: PublishSuitability[] }> {
  const material = await materialRepository.findById(params.materialId)

  if (!material)
    throw new Error('Material not found')

  if (material.status !== UploadedMaterialStatus.PUBLISHED)
    throw new Error('Only published materials can be shared')

  const suitability = evaluateMaterialPublishSuitability(material)
  const suitablePlatforms = new Set(suitability.filter(item => item.suitable).map(item => item.platform))
  const requestedPlatforms = params.platforms?.length
    ? params.platforms.filter(platform => isSupportedPlatform(platform) && suitablePlatforms.has(platform))
    : Array.from(suitablePlatforms)
  const activePlatformConfigs = await socialPlatformConfigRepository.findActiveByPlatforms(requestedPlatforms)
  const activePlatforms = new Set(activePlatformConfigs.map(config => config.platform))
  const enabledRequestedPlatforms = requestedPlatforms.filter(platform => activePlatforms.has(platform))

  const accounts = await socialAccountRepository.findByUserIdAndPlatforms(params.userId, enabledRequestedPlatforms)
  const post: PublishPostInput = {
    id: material.id,
    title: material.title,
    content: material.content,
    url: buildMaterialUrl(material.id),
    videoUrl: getMaterialVideoUrl(material),
    videoContentType: material.fileContentType,
  }
  const results: PublishResult[] = []

  for (const account of accounts) {
    if (account.platform === SocialPlatform.FACEBOOK) {
      results.push(await publishToFacebook(post, account))
      continue
    }

    if (account.platform === SocialPlatform.YOUTUBE) {
      results.push(await publishToYoutube(post, account))
      continue
    }

    const platform = toSocialPlatform(account.platform)

    if (!platform)
      continue

    results.push({
      platform,
      accountId: account.id,
      status: 'skipped',
      message: 'Unsupported platform',
    })
  }

  return { results, suitability }
}
