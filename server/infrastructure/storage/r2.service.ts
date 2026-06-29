import { Buffer } from 'node:buffer'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { env } from '~/config/env'

const R2_REGION = 'auto'
const R2_SERVICE = 's3'
const MATERIAL_UPLOAD_PREFIX = 'test/materials'
const ANALYTICS_REPLAY_PREFIX = 'test/analytics/replay'
const R2_UPLOAD_TIMEOUT = 8000
const R2_DOWNLOAD_TIMEOUT = 8000

export interface UploadedObject {
  key: string
  name: string
  size: number
  contentType: string
  url: string
}

export interface PresignedObjectUrl {
  key: string
  url: string
  expiresAt: string
}

function hashHex(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest('hex')
}

function getSigningKey(dateStamp: string) {
  const dateKey = hmac(`AWS4${env.R2_SECRET_ACCESS_KEY}`, dateStamp)
  const regionKey = hmac(dateKey, R2_REGION)
  const serviceKey = hmac(regionKey, R2_SERVICE)
  return hmac(serviceKey, 'aws4_request')
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
  return normalized || 'upload'
}

function buildObjectKey(fileName: string) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const safeName = sanitizeFileName(fileName)
  const prefix = env.R2_UPLOAD_PREFIX === 'test'
    ? MATERIAL_UPLOAD_PREFIX
    : `test/${env.R2_UPLOAD_PREFIX.replace(/^\/+|\/+$/g, '')}/materials`

  return `${prefix}/${year}/${month}/${randomUUID()}-${safeName}`
}

function buildPublicUrl(key: string) {
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/g, '')}/${key}`
}

function buildAnalyticsReplayKey(params: {
  sessionId: string
  chunkIndex: number
  extension?: string
}) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const safeSessionId = params.sessionId.replace(/[^\w-]+/g, '-')
  const extension = params.extension ?? 'json'

  return `${ANALYTICS_REPLAY_PREFIX}/${year}/${month}/${day}/${safeSessionId}/chunk-${params.chunkIndex}.${extension}`
}

function buildCanonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

function buildPresignedUrl(params: {
  method: 'GET' | 'PUT' | 'DELETE'
  key: string
  expiresInSeconds: number
  contentType?: string
}) {
  const endpoint = new URL(env.R2_ENDPOINT)
  const encodedKey = params.key.split('/').map(part => encodeURIComponent(part)).join('/')
  const pathname = `/${env.R2_BUCKET}/${encodedKey}`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`
  const signedHeaders = params.contentType ? 'content-type;host' : 'host'
  const canonicalHeaders = params.contentType
    ? `content-type:${params.contentType}\nhost:${endpoint.host}\n`
    : `host:${endpoint.host}\n`
  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${env.R2_ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(params.expiresInSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  }
  const canonicalQuery = buildCanonicalQuery(query)
  const canonicalRequest = [
    params.method,
    pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join('\n')
  const signature = hmacHex(getSigningKey(dateStamp), stringToSign)
  const requestUrl = new URL(pathname, endpoint)

  requestUrl.search = `${canonicalQuery}&X-Amz-Signature=${signature}`

  return {
    url: requestUrl.toString(),
    expiresAt: new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString(),
  }
}

function buildPutRequest(key: string, body: Buffer, contentType: string) {
  const endpoint = new URL(env.R2_ENDPOINT)
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/')
  const pathname = `/${env.R2_BUCKET}/${encodedKey}`
  const requestUrl = new URL(pathname, endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = hashHex(body)
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${endpoint.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n')
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [
    'PUT',
    pathname,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n')
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join('\n')
  const signature = hmacHex(getSigningKey(dateStamp), stringToSign)
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ')

  return {
    authorization,
    payloadHash,
    requestUrl,
    amzDate,
  }
}

async function fetchWithTimeout(url: URL | string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  }
  finally {
    clearTimeout(timeoutId)
  }
}

export class R2StorageService {
  async uploadMaterialFile(file: File): Promise<UploadedObject> {
    const body = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/octet-stream'
    const key = buildObjectKey(file.name)
    const request = buildPutRequest(key, body, contentType)

    const response = await fetchWithTimeout(request.requestUrl, {
      method: 'PUT',
      headers: {
        'Authorization': request.authorization,
        'Content-Type': contentType,
        'x-amz-content-sha256': request.payloadHash,
        'x-amz-date': request.amzDate,
      },
      body: new Uint8Array(body),
    }, R2_UPLOAD_TIMEOUT)

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`R2 upload failed: ${response.status} ${detail}`)
    }

    return {
      key,
      name: file.name,
      size: file.size,
      contentType,
      url: buildPublicUrl(key),
    }
  }

  async uploadObject(params: {
    key: string
    body: Buffer | string
    contentType: string
  }): Promise<{ key: string, size: number, contentType: string }> {
    const body = typeof params.body === 'string' ? Buffer.from(params.body) : params.body
    const request = buildPutRequest(params.key, body, params.contentType)

    const response = await fetchWithTimeout(request.requestUrl, {
      method: 'PUT',
      headers: {
        'Authorization': request.authorization,
        'Content-Type': params.contentType,
        'x-amz-content-sha256': request.payloadHash,
        'x-amz-date': request.amzDate,
      },
      body: new Uint8Array(body),
    }, R2_UPLOAD_TIMEOUT)

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`R2 upload failed: ${response.status} ${detail}`)
    }

    return {
      key: params.key,
      size: body.byteLength,
      contentType: params.contentType,
    }
  }

  async uploadAnalyticsReplayChunk(params: {
    sessionId: string
    chunkIndex: number
    payload: string
    contentType: string
  }) {
    const key = this.createAnalyticsReplayKey({
      sessionId: params.sessionId,
      chunkIndex: params.chunkIndex,
    })

    return this.uploadObject({
      key,
      body: params.payload,
      contentType: params.contentType,
    })
  }

  getPublicUrl(key: string | null | undefined) {
    if (!key)
      return null

    return buildPublicUrl(key)
  }

  createAnalyticsReplayKey(params: { sessionId: string, chunkIndex: number, compressed?: boolean }) {
    return buildAnalyticsReplayKey({
      sessionId: params.sessionId,
      chunkIndex: params.chunkIndex,
      extension: params.compressed ? 'json.gz' : 'json',
    })
  }

  createPresignedPutUrl(key: string, contentType: string, expiresInSeconds = 300): PresignedObjectUrl {
    const signed = buildPresignedUrl({
      method: 'PUT',
      key,
      contentType,
      expiresInSeconds,
    })

    return {
      key,
      url: signed.url,
      expiresAt: signed.expiresAt,
    }
  }

  createPresignedGetUrl(key: string, expiresInSeconds = 900): PresignedObjectUrl {
    const signed = buildPresignedUrl({
      method: 'GET',
      key,
      expiresInSeconds,
    })

    return {
      key,
      url: signed.url,
      expiresAt: signed.expiresAt,
    }
  }

  async getObjectText(key: string): Promise<string> {
    const signed = buildPresignedUrl({
      method: 'GET',
      key,
      expiresInSeconds: 300,
    })
    const response = await fetchWithTimeout(signed.url, { method: 'GET' }, R2_DOWNLOAD_TIMEOUT)

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`R2 read failed: ${response.status} ${detail}`)
    }

    return response.text()
  }

  async deleteObject(key: string): Promise<void> {
    const signed = buildPresignedUrl({
      method: 'DELETE',
      key,
      expiresInSeconds: 300,
    })

    const response = await fetch(signed.url, { method: 'DELETE' })

    if (!response.ok && response.status !== 404) {
      const detail = await response.text()
      throw new Error(`R2 delete failed: ${response.status} ${detail}`)
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.deleteObject(key)))
  }
}
