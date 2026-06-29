import type { SocialPlatformConfig } from '~/server/infrastructure/database/schema/social-platform-config.schema'

interface FacebookTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: {
    message?: string
    type?: string
    code?: number
  }
}

interface FacebookPageResponse {
  data?: Array<{
    id: string
    name?: string
    access_token?: string
  }>
  error?: {
    message?: string
    type?: string
    code?: number
  }
}

/**
 * Facebook OAuth token and page access service.
 */
export class FacebookOAuthService {
  /**
   * Exchange authorization code for user access token.
   */
  async exchangeCode(params: {
    code: string
    redirectUri: string
    config: SocialPlatformConfig
  }): Promise<{ accessToken: string, expiresAt: Date | null }> {
    const url = new URL(params.config.tokenUrl)
    url.searchParams.set('client_id', params.config.clientId)
    url.searchParams.set('client_secret', params.config.clientSecret)
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('code', params.code)

    const response = await fetch(url)
    const data = await response.json() as FacebookTokenResponse

    if (!response.ok || !data.access_token) {
      throw new Error(data.error?.message ?? 'Facebook token exchange failed')
    }

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    }
  }

  /**
   * Fetch manageable Facebook pages for the connected user.
   */
  async findFirstPage(params: {
    accessToken: string
    config: SocialPlatformConfig
  }): Promise<{ id: string, accessToken: string } | null> {
    const apiBaseUrl = params.config.apiBaseUrl.replace(/\/+$/g, '')
    const url = new URL(`${apiBaseUrl}/me/accounts`)
    url.searchParams.set('fields', 'id,name,access_token')
    url.searchParams.set('access_token', params.accessToken)

    const response = await fetch(url)
    const data = await response.json() as FacebookPageResponse

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Facebook page lookup failed')
    }

    const page = data.data?.find(item => item.id && item.access_token)

    if (!page?.access_token)
      return null

    return {
      id: page.id,
      accessToken: page.access_token,
    }
  }
}
