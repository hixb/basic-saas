import { env } from '~/config/env'
import { SocialAccountRepository } from '~/server/infrastructure/database/repositories/social-account.repository'
import { SocialPlatformConfigRepository } from '~/server/infrastructure/database/repositories/social-platform-config.repository'
import { SocialPlatform } from '~/server/infrastructure/database/schema/social-account.schema'
import { FacebookOAuthService } from '~/server/infrastructure/oauth/facebook-oauth.service'

const platformConfigRepository = new SocialPlatformConfigRepository()
const socialAccountRepository = new SocialAccountRepository()
const facebookOAuthService = new FacebookOAuthService()

function buildRedirectUri() {
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/g, '')}/api/facebook/callback`
}

/**
 * Connects a Facebook page account from an OAuth callback code.
 */
export async function connectFacebookFromCallback(params: {
  userId: number
  code: string
}) {
  const config = await platformConfigRepository.findActiveByPlatform(SocialPlatform.FACEBOOK)

  if (!config)
    throw new Error('Facebook platform configuration is not enabled')

  const token = await facebookOAuthService.exchangeCode({
    code: params.code,
    redirectUri: buildRedirectUri(),
    config,
  })
  const page = await facebookOAuthService.findFirstPage({
    accessToken: token.accessToken,
    config,
  })

  if (!page)
    throw new Error('No manageable Facebook page was returned')

  const account = await socialAccountRepository.upsertByPlatformAccount({
    userId: params.userId,
    platform: SocialPlatform.FACEBOOK,
    platformAccountId: page.id,
    accessToken: page.accessToken,
    refreshToken: null,
    expiresAt: token.expiresAt,
  })

  return {
    accountId: account.id,
    platformAccountId: account.platformAccountId,
  }
}
