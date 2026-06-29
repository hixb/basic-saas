import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'
import type { ValidationErrorData, ValidationErrorReason } from '~/shared/types/api.type'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'
import { ApiResponseError } from '~/utils/api-response-error'

type Translate = (key: any, values?: any) => string

function getFieldLabel(fieldLabels: Record<string, string>, field?: string) {
  return field && fieldLabels[field] ? fieldLabels[field] : fieldLabels.form
}

function normalizeReason(reason?: string): ValidationErrorReason {
  if (
    reason === 'required'
    || reason === 'too_small'
    || reason === 'too_big'
    || reason === 'invalid_email'
    || reason === 'invalid_url'
    || reason === 'invalid_type'
    || reason === 'sensitive_content'
  ) {
    return reason
  }

  return 'unknown'
}

export function getAdminValidationMessage(
  t: Translate,
  data: ValidationErrorData | undefined,
  fieldLabels: Record<string, string>,
) {
  const field = getFieldLabel(fieldLabels, data?.field)
  const reason = normalizeReason(data?.reason)

  if (reason === 'required' || reason === 'invalid_type')
    return t('common.admin.formErrors.required', { field })

  if (reason === 'too_small')
    return t('common.admin.formErrors.tooSmall', { field, min: data?.min ?? 1 })

  if (reason === 'too_big')
    return t('common.admin.formErrors.tooBig', { field, max: data?.max ?? 0 })

  if (reason === 'invalid_email')
    return t('common.admin.formErrors.invalidEmail')

  if (reason === 'invalid_url')
    return t('common.admin.formErrors.invalidUrl', { field })

  return t('common.admin.formErrors.unknown')
}

export function getAdminSubmitErrorMessage(
  error: unknown,
  t: Translate,
  fieldLabels: Record<string, string>,
) {
  if (error instanceof ApiResponseError) {
    const data = error.response.data as ValidationErrorData | null

    if (
      error.response.code === ResponseCode.INVALID_FORM_INPUT
      || error.response.code === ResponseCode.VALIDATION_ERROR
    ) {
      return getAdminValidationMessage(t, data ?? undefined, fieldLabels)
    }
  }

  return t('common.admin.formErrors.unknown')
}

function buildFieldError(message: string, type: string): FieldError {
  return {
    type,
    message,
  }
}

export function createZodI18nResolver<TFieldValues extends FieldValues>(
  schema: z.ZodType,
  t: Translate,
  fieldLabels: Record<string, string>,
): Resolver<TFieldValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)

    if (result.success) {
      return {
        values: result.data as TFieldValues,
        errors: {},
      }
    }

    const errors: FieldErrors<TFieldValues> = {}

    for (const issue of result.error.issues) {
      const data = mapValidationIssue(issue)
      const field = data.field

      if (!field)
        continue

      errors[field as keyof TFieldValues] = buildFieldError(
        getAdminValidationMessage(t, data, fieldLabels),
        data.reason,
      ) as FieldErrors<TFieldValues>[keyof TFieldValues]
    }

    return {
      values: {},
      errors,
    }
  }
}
