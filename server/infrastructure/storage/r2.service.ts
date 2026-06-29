import { Buffer } from 'node:buffer'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { env } from '~/config/env'

const R2_REGION = 'auto'
const R2_SERVICE = 's3'
const MATERIAL_UPLOAD_PREFIX = 'test/materials'

export interface UploadedObject {
  key: string
  name: string
  size: number
  contentType: string
  url: string
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

export class R2StorageService {
  async uploadMaterialFile(file: File): Promise<UploadedObject> {
    const body = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/octet-stream'
    const key = buildObjectKey(file.name)
    const request = buildPutRequest(key, body, contentType)

    const response = await fetch(request.requestUrl, {
      method: 'PUT',
      headers: {
        'Authorization': request.authorization,
        'Content-Type': contentType,
        'x-amz-content-sha256': request.payloadHash,
        'x-amz-date': request.amzDate,
      },
      body,
    })

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

  getPublicUrl(key: string | null | undefined) {
    if (!key)
      return null

    return buildPublicUrl(key)
  }
}
