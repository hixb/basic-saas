import type { NextRequest } from 'next/server'
import type { NewUploadedMaterial } from '~/server/infrastructure/database/schema/uploaded-material.schema'
import { NextResponse } from 'next/server'
import { findPublicMaterialById, findPublicMaterials } from '~/server/application/content/public-material.query'
import { calculatePagination, created, deleted, fail, notFound, ok, paginated, updated } from '~/server/core/response/response.helper'
import { UploadedMaterialRepository } from '~/server/infrastructure/database/repositories/uploaded-material.repository'
import { createMaterialSchema } from '~/shared/schemas/content.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const materialRepository = new UploadedMaterialRepository()

function escapeCsvValue(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const headers = ['ID', 'Title', 'Summary', 'Category', 'File Name', 'File Size', 'File Key', 'Content Type', 'Status', 'Created At']
  const lines = rows.map(row => [
    row.id,
    row.title,
    row.summary,
    row.category,
    row.fileName,
    row.fileSize,
    row.fileKey,
    row.fileContentType,
    row.status,
    row.createdAt,
  ].map(escapeCsvValue).join(','))

  return [headers.map(escapeCsvValue).join(','), ...lines].join('\n')
}

/**
 * Handle admin material creation.
 */
export async function handleCreateMaterial(request: NextRequest) {
  const body = await request.json()
  const validation = createMaterialSchema.safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const material = await materialRepository.create({
    title: validation.data.title,
    summary: validation.data.summary,
    category: validation.data.category,
    content: validation.data.content,
    coverKey: validation.data.coverKey || null,
    fileName: validation.data.fileName || null,
    fileSize: validation.data.fileSize,
    fileKey: validation.data.fileKey || null,
    fileContentType: validation.data.fileContentType || null,
    status: validation.data.status,
  })

  return created({ id: material.id, status: material.status })
}

/**
 * Handle admin material list request.
 */
export async function handleGetAdminMaterials(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10)
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'

  const result = await materialRepository.findPaginated({
    page,
    pageSize,
    keyword,
    sortDirection,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Handle admin material detail request.
 */
export async function handleGetAdminMaterialDetail(id: number) {
  const material = await materialRepository.findById(id)

  if (!material)
    return notFound('Material not found')

  return ok(material)
}

/**
 * Handle admin material export request.
 */
export async function handleExportAdminMaterials(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('keyword') ?? undefined
  const sortDirection = searchParams.get('dir') === 'ascending' ? 'ascending' : 'descending'
  const materials = await materialRepository.findForExport({ keyword, sortDirection })
  const csv = toCsv(materials)
  const fileName = `materials-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  })
}

/**
 * Handle admin material update.
 */
export async function handleUpdateMaterial(request: NextRequest, id: number) {
  const body = await request.json()
  const validation = createMaterialSchema.partial().safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  const updateData: Partial<NewUploadedMaterial> = { ...validation.data }

  if ('coverKey' in updateData)
    updateData.coverKey = updateData.coverKey || null
  if ('fileName' in updateData)
    updateData.fileName = updateData.fileName || null
  if ('fileKey' in updateData)
    updateData.fileKey = updateData.fileKey || null
  if ('fileContentType' in updateData)
    updateData.fileContentType = updateData.fileContentType || null

  const material = await materialRepository.update(id, updateData)

  if (!material)
    return notFound('Material not found')

  return updated({ id: material.id, status: material.status })
}

/**
 * Handle admin material deletion.
 */
export async function handleDeleteMaterial(id: number) {
  await materialRepository.delete(id)
  return deleted()
}

/**
 * Handle public material list request.
 */
export async function handleGetPublicMaterials(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(Number.parseInt(searchParams.get('pageSize') ?? '6', 10), 12)

  const result = await findPublicMaterials({
    page,
    pageSize,
  })

  return paginated(result.data, calculatePagination(result.total, page, pageSize))
}

/**
 * Handle public material detail request.
 */
export async function handleGetPublicMaterialDetail(id: number) {
  const material = await findPublicMaterialById(id)

  if (!material)
    return notFound('Material not found')

  return ok(material)
}
