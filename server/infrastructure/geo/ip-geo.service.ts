import type { NextRequest } from 'next/server'

export interface IpGeoSnapshot {
  ip: string | null
  countryCode: string | null
  region: string | null
  country: string | null
  city: string | null
  emoji: string
}

interface IpWhoIsResponse {
  success?: boolean
  ip?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  flag?: {
    emoji?: string
  }
}

function isLikelyPrivateIp(ip: string) {
  if (
    ip === '127.0.0.1'
    || ip.startsWith('10.')
    || ip.startsWith('192.168.')
    || /^172\.(?:1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return true
  }

  const normalized = ip.toLowerCase()
  return normalized === '::1'
    || normalized.startsWith('fe80:')
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
}

function normalizeIp(ip: string) {
  const trimmed = ip.trim()
  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/)
  return ipv4WithPort?.[1] ?? trimmed
}

/**
 * Extract public client IP from proxy headers.
 */
export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]
  const realIp = request.headers.get('x-real-ip')
  const requestIp = 'ip' in request ? String(request.ip ?? '') : ''
  const candidate = forwardedFor || realIp || requestIp

  if (!candidate)
    return null

  const ip = normalizeIp(candidate)
  return isLikelyPrivateIp(ip) ? null : ip
}

/**
 * Fetch IP geo data from ipwho.is.
 */
export async function fetchGeoByIp(ip: string | null): Promise<IpGeoSnapshot | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`https://ipwho.is/${ip ?? ''}`, {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok)
      return null

    const data = await response.json() as IpWhoIsResponse

    if (!data.success)
      return null

    return {
      ip: data.ip ?? ip,
      countryCode: data.country_code ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      emoji: data.flag?.emoji ?? '🏳️',
    }
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timeoutId)
  }
}
