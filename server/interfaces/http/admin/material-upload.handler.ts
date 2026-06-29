import type { NextRequest } from 'next/server'
import { badRequest, internalError, ok } from '~/server/core/response/response.helper'
import { R2StorageService } from '~/server/infrastructure/storage/r2.service'

const storage = new R2StorageService()

/**
 * Handle admin material file upload.
 */
export async function handleUploadMaterialFile(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File))
    return badRequest('File is required')

  if (file.size > 50_000_000)
    return badRequest('File size must be no more than 50MB')

  try {
    const uploaded = await storage.uploadMaterialFile(file)
    return ok(uploaded)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return internalError('Material upload failed')
  }
}
