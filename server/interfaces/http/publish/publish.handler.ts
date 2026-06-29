import type { NextRequest } from 'next/server'
import { publishMaterialToPlatforms } from '~/server/application/publish/publish-material.usecase'
import { badRequest, fail, notFound, ok } from '~/server/core/response/response.helper'
import { publishRequestSchema } from '~/shared/schemas/publish.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

/**
 * Handles one-click social publishing for admin materials.
 */
export async function handlePublish(request: NextRequest, userId: number) {
  const body = await request.json()
  const validation = publishRequestSchema.safeParse(body)

  if (!validation.success) {
    return fail(ResponseCode.INVALID_FORM_INPUT, 'Invalid form input', mapValidationIssue(validation.error.issues[0]))
  }

  try {
    const result = await publishMaterialToPlatforms({
      materialId: validation.data.postId,
      userId,
      platforms: validation.data.platforms,
    })

    return ok(result)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed'

    if (message === 'Material not found')
      return notFound(message)

    if (message === 'Only published materials can be shared')
      return badRequest(message)

    return fail(ResponseCode.EXTERNAL_SERVICE_ERROR, message)
  }
}
